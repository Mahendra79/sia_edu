import csv
import hashlib
import io
from decimal import Decimal

import requests
from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import HttpResponse, StreamingHttpResponse
from django.core.cache import cache
from django.db import transaction
from django.db.models import Avg, Case, CharField, Count, Exists, FloatField, IntegerField, OuterRef, Q, Subquery, Value, When
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsActiveAuthenticated, IsAdminUserRole
from analytics.models import AdminActivityLog
from config.pagination import StandardResultsSetPagination
from courses.models import Category, Course, CourseLesson, Enrollment, Quiz, QuizAttempt, QuizAttemptAnswer, QuizOption, QuizQuestion, Review, ReviewVote, UserLessonProgress
from courses.serializers import (
    AdminEnrollmentSerializer,
    AdminEnrollmentUpdateSerializer,
    CourseLessonAdminSerializer,
    LessonProgressUpdateSerializer,
    LearnerQuizSummarySerializer,
    AdminReviewSerializer,
    AdminReviewUpdateSerializer,
    CategorySerializer,
    CourseSerializer,
    EnrollmentSerializer,
    QuizAdminSerializer,
    QuizAnswerSaveSerializer,
    QuizAttemptAnswerSerializer,
    QuizAttemptResultSerializer,
    QuizAttemptSerializer,
    QuizQuestionAdminSerializer,
    ReviewSerializer,
)
from deleted_records.services import record_soft_delete
from payments.models import PaymentTransaction

COURSE_CACHE_VERSION_KEY = "courses:cache_version"
CATEGORY_CACHE_TTL = 120
COURSE_CACHE_TTL = 60
LESSON_MEDIA_TOKEN_MAX_AGE_SECONDS = getattr(settings, "LESSON_MEDIA_TOKEN_MAX_AGE_SECONDS", 60 * 60 * 12)


def _make_lesson_media_token(lesson_id: int) -> str:
    return TimestampSigner(salt="lesson-media").sign(str(lesson_id))


def _is_valid_lesson_media_token(token: str, lesson_id: int) -> bool:
    try:
        value = TimestampSigner(salt="lesson-media").unsign(
            token,
            max_age=LESSON_MEDIA_TOKEN_MAX_AGE_SECONDS,
        )
    except (BadSignature, SignatureExpired):
        return False
    return str(value) == str(lesson_id)


def _get_cache_version() -> int:
    version = cache.get(COURSE_CACHE_VERSION_KEY)
    if version is None:
        version = 1
        cache.set(COURSE_CACHE_VERSION_KEY, version, None)
    return int(version)


def _bump_cache_version() -> None:
    version = _get_cache_version() + 1
    cache.set(COURSE_CACHE_VERSION_KEY, version, None)


def _build_cache_key(prefix: str, request, include_user: bool = True) -> str:
    version = _get_cache_version()
    user_key = "anon"
    if include_user and request.user.is_authenticated:
        user_key = f"user:{request.user.id}"
    raw = f"{prefix}|v={version}|{user_key}|{request.get_full_path()}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{prefix}:{digest}"


def _annotated_course_queryset(user):
    purchased_annotation = {}
    if user and user.is_authenticated:
        purchased_enrollment = Enrollment.objects.filter(
            user=user,
            course_id=OuterRef("pk"),
            payment_status="success",
            is_deleted=False,
        )
        purchased_annotation = {"is_purchased_flag": Exists(purchased_enrollment)}

    review_base = Review.objects.filter(course_id=OuterRef("pk"), is_deleted=False).values("course_id")
    avg_rating_subquery = review_base.annotate(avg=Avg("rating")).values("avg")[:1]
    review_count_subquery = review_base.annotate(cnt=Count("id")).values("cnt")[:1]

    return (
        Course.objects.filter(is_deleted=False)
        .select_related("category")
        .annotate(
            avg_rating=Coalesce(Subquery(avg_rating_subquery, output_field=FloatField()), Value(0.0)),
            reviews_count=Coalesce(Subquery(review_count_subquery, output_field=IntegerField()), Value(0)),
            **purchased_annotation,
        )
    )


PINNED_COURSE_TITLE = "Advanced Quantum Computing using HDQS"


def _ordered_course_queryset(queryset):
    return queryset.annotate(
        pinned_order=Case(
            When(title=PINNED_COURSE_TITLE, then=Value(0)),
            default=Value(1),
            output_field=IntegerField(),
        )
    ).order_by("pinned_order", "-created_at")


def _log_admin_action(user, action: str, target_type: str, target_id: str, details: str = ""):
    if user and user.is_authenticated and user.is_admin:
        AdminActivityLog.objects.create(
            admin_user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )


def _has_success_enrollment(user, course_id: int) -> bool:
    return Enrollment.objects.filter(
        user=user,
        course_id=course_id,
        payment_status="success",
        is_deleted=False,
    ).exists()


def _quiz_publish_issues(quiz: Quiz) -> list[str]:
    issues = []
    active_questions = list(quiz.questions.filter(is_active=True).prefetch_related("options"))
    if not active_questions:
        issues.append("Add at least 1 active question before publishing.")
    if len(active_questions) > 50:
        issues.append("A quiz can have a maximum of 50 active questions.")
    for question in active_questions:
        options = list(question.options.all())
        if len(options) != 4:
            issues.append(f"Question {question.order} must have exactly 4 options.")
        if sum(1 for option in options if option.is_correct) != 1:
            issues.append(f"Question {question.order} must have exactly 1 correct option.")
    if quiz.time_per_question_seconds < 5:
        issues.append("Question timer must be at least 5 seconds.")
    return issues


def _build_lms_payload(user, course: Course):
    db_lessons = list(
        CourseLesson.objects.filter(course=course).order_by("module_number", "lesson_number", "id")
    )
    lesson_map = {(item.module_number, item.lesson_number): item for item in db_lessons}
    completed_ids = set(
        UserLessonProgress.objects.filter(user=user, lesson__in=db_lessons, is_completed=True).values_list("lesson_id", flat=True)
    )

    modules = []
    module_numbers = range(1, 9)
    project_module_number = 9

    def lesson_count_for_module(module_number):
        return 5 if module_number <= 3 else 4

    total_lessons = sum(lesson_count_for_module(module_number) for module_number in module_numbers)
    completed_lessons = 0

    for module_number in module_numbers:
        module_lessons = []
        module_completed = True
        for lesson_number in range(1, lesson_count_for_module(module_number) + 1):
            lesson = lesson_map.get((module_number, lesson_number))
            has_video = bool(lesson and str(lesson.video_url or "").strip())
            has_pdf = bool(lesson and str(lesson.pdf_url or "").strip())
            is_active = bool(lesson and lesson.is_active)
            is_unlocked = bool(lesson and (has_video or has_pdf) and is_active)
            is_completed = bool(lesson and lesson.id in completed_ids)
            if is_completed:
                completed_lessons += 1
            if not is_completed:
                module_completed = False

            module_lessons.append(
                {
                    "id": lesson.id if lesson else f"m{module_number}-l{lesson_number}",
                    "module_number": module_number,
                    "lesson_number": lesson_number,
                    "title": lesson.title if lesson else f"Lesson {lesson_number}",
                    "description": lesson.description if lesson else "",
                    "thumbnail_url": lesson.thumbnail_url if lesson else "",
                    "duration": lesson.duration if lesson else "",
                    "has_pdf": has_pdf,
                    "has_video": has_video,
                    "is_active": bool(is_active),
                    "is_completed": is_completed,
                    "is_unlocked": is_unlocked,
                }
            )

        modules.append(
            {
                "module_number": module_number,
                "title": f"Module {module_number}",
                "lessons": module_lessons,
                "is_completed": module_completed,
                "is_project_section": False,
            }
        )

    project_lessons = [lesson for lesson in db_lessons if lesson.module_number == project_module_number]
    project_module_lessons = []
    project_completed = True
    for lesson in project_lessons:
        has_video = bool(str(lesson.video_url or "").strip())
        has_pdf = bool(str(lesson.pdf_url or "").strip())
        is_active = bool(lesson.is_active)
        is_unlocked = bool(has_pdf and is_active)
        is_completed = lesson.id in completed_ids
        if not is_completed:
            project_completed = False

        project_module_lessons.append(
            {
                "id": lesson.id,
                "module_number": project_module_number,
                "lesson_number": lesson.lesson_number,
                "title": lesson.title,
                "description": lesson.description,
                "thumbnail_url": lesson.thumbnail_url,
                "duration": lesson.duration,
                "has_pdf": has_pdf,
                "has_video": has_video,
                "is_active": is_active,
                "is_completed": is_completed,
                "is_unlocked": is_unlocked,
                "is_project": True,
            }
        )

    modules.append(
        {
            "module_number": project_module_number,
            "title": "Projects",
            "lessons": project_module_lessons,
            "is_completed": bool(project_module_lessons) and project_completed,
            "is_project_section": True,
        }
    )

    progress_percent = round((completed_lessons / total_lessons) * 100) if total_lessons else 0

    return {
        "course_id": course.id,
        "course_title": course.title,
        "modules": modules,
        "progress_percent": progress_percent,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
    }


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        return Category.objects.filter(is_deleted=False)

    def list(self, request, *args, **kwargs):
        cache_key = _build_cache_key("categories-list", request, include_user=False)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        response = super().list(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            cache.set(cache_key, response.data, CATEGORY_CACHE_TTL)
        return response

    def perform_create(self, serializer):
        category = serializer.save()
        _bump_cache_version()
        _log_admin_action(self.request.user, "create_category", "Category", str(category.id), category.name)


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserRole]
    queryset = Category.objects.filter(is_deleted=False)

    def perform_update(self, serializer):
        category = serializer.save()
        _bump_cache_version()
        _log_admin_action(self.request.user, "update_category", "Category", str(category.id), category.name)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        reason = request.data.get("reason", "admin_soft_delete")
        record_soft_delete(category, deleted_by=request.user, reason=reason)
        category.is_deleted = True
        category.save(update_fields=["is_deleted"])
        _bump_cache_version()
        _log_admin_action(request.user, "delete_category", "Category", str(category.id), category.name)
        return Response({"message": "Category soft deleted."}, status=status.HTTP_200_OK)


class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        queryset = _annotated_course_queryset(self.request.user)
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(title__icontains=search)

        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        scope = self.request.query_params.get("scope", "").strip().lower()
        if scope == "active":
            queryset = queryset.filter(is_active=True)
        elif scope == "inactive":
            queryset = queryset.filter(is_active=False)
        elif scope == "purchased":
            queryset = queryset.filter(
                payment_transactions__is_deleted=False,
                payment_transactions__payment_status="success",
            ).distinct()
        elif scope == "unpaid":
            queryset = queryset.exclude(
                payment_transactions__is_deleted=False,
                payment_transactions__payment_status="success",
            ).distinct()
        return _ordered_course_queryset(queryset)

    def list(self, request, *args, **kwargs):
        cache_key = _build_cache_key("courses-list", request, include_user=True)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        response = super().list(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            cache.set(cache_key, response.data, COURSE_CACHE_TTL)
        return response

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["search_query"] = self.request.query_params.get("search", "")
        return context

    def perform_create(self, serializer):
        course = serializer.save()
        _bump_cache_version()
        _log_admin_action(self.request.user, "create_course", "Course", str(course.id), course.title)


class CourseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        return _annotated_course_queryset(self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["search_query"] = ""
        return context

    def perform_update(self, serializer):
        course = serializer.save()
        _bump_cache_version()
        _log_admin_action(self.request.user, "update_course", "Course", str(course.id), course.title)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        reason = request.data.get("reason", "admin_soft_delete")
        record_soft_delete(course, deleted_by=request.user, reason=reason)
        course.is_deleted = True
        course.is_active = False
        course.save(update_fields=["is_deleted", "is_active", "updated_at"])
        _bump_cache_version()
        _log_admin_action(request.user, "delete_course", "Course", str(course.id), course.title)
        return Response({"message": "Course soft deleted."}, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        cache_key = _build_cache_key("course-detail", request, include_user=True)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            cache.set(cache_key, response.data, COURSE_CACHE_TTL)
        return response


class RelatedCoursesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id: int):
        course = Course.objects.filter(id=course_id, is_deleted=False).select_related("category").first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        limit = request.query_params.get("limit", 6)
        try:
            limit_value = min(max(int(limit), 1), 20)
        except (TypeError, ValueError):
            limit_value = 6

        base_queryset = _annotated_course_queryset(request.user).filter(is_active=True).exclude(id=course.id)
        related_queryset = _ordered_course_queryset(base_queryset.filter(category_id=course.category_id))
        related_items = list(related_queryset[:limit_value])

        if len(related_items) < limit_value:
            existing_ids = [item.id for item in related_items]
            fallback_queryset = _ordered_course_queryset(base_queryset.exclude(id__in=existing_ids))
            related_items.extend(list(fallback_queryset[: (limit_value - len(related_items))]))

        serializer = CourseSerializer(related_items, many=True, context={"request": request, "search_query": ""})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseReviewsView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsActiveAuthenticated()]

    def get(self, request, course_id: int):
        course = Course.objects.filter(id=course_id, is_deleted=False).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        queryset = (
            Review.objects.filter(course=course, is_deleted=False)
            .select_related("user")
            .annotate(
                helpful_likes_count=Count("votes", filter=Q(votes__vote=ReviewVote.VOTE_LIKE)),
                helpful_dislikes_count=Count("votes", filter=Q(votes__vote=ReviewVote.VOTE_DISLIKE)),
            )
        )

        if request.user.is_authenticated:
            user_vote_subquery = ReviewVote.objects.filter(review_id=OuterRef("pk"), user=request.user).values("vote")[:1]
            queryset = queryset.annotate(my_vote_value=Subquery(user_vote_subquery, output_field=CharField()))

        queryset = queryset.order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = ReviewSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, course_id: int):
        course = Course.objects.filter(id=course_id, is_deleted=False).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

        has_successful_purchase = Enrollment.objects.filter(
            user=request.user,
            course=course,
            payment_status="success",
            is_deleted=False,
        ).exists()
        if not has_successful_purchase:
            return Response(
                {"detail": "Only students with successful purchase can submit a review."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReviewSerializer(data={**request.data, "course": course.id})
        serializer.is_valid(raise_exception=True)
        review, created = Review.objects.update_or_create(
            user=request.user,
            course=course,
            defaults={
                "rating": serializer.validated_data["rating"],
                "comment": serializer.validated_data.get("comment", ""),
                "is_deleted": False,
            },
        )
        _bump_cache_version()
        out = ReviewSerializer(review, context={"request": request})
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(out.data, status=status_code)


class ReviewVoteView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def post(self, request, review_id: int):
        review = Review.objects.filter(id=review_id, is_deleted=False, course__is_deleted=False).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        vote_value = str(request.data.get("vote", "")).strip().lower()
        if vote_value not in {ReviewVote.VOTE_LIKE, ReviewVote.VOTE_DISLIKE}:
            return Response(
                {"detail": "Vote must be 'like' or 'dislike'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_vote = ReviewVote.objects.filter(review=review, user=request.user).first()
        my_vote = vote_value

        if existing_vote and existing_vote.vote == vote_value:
            existing_vote.delete()
            my_vote = None
        elif existing_vote:
            existing_vote.vote = vote_value
            existing_vote.save(update_fields=["vote", "updated_at"])
        else:
            ReviewVote.objects.create(review=review, user=request.user, vote=vote_value)

        votes = ReviewVote.objects.filter(review=review).aggregate(
            helpful_likes_count=Count("id", filter=Q(vote=ReviewVote.VOTE_LIKE)),
            helpful_dislikes_count=Count("id", filter=Q(vote=ReviewVote.VOTE_DISLIKE)),
        )
        return Response(
            {
                "review_id": review.id,
                "my_vote": my_vote,
                "helpful_likes_count": votes["helpful_likes_count"] or 0,
                "helpful_dislikes_count": votes["helpful_dislikes_count"] or 0,
            },
            status=status.HTTP_200_OK,
        )


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsActiveAuthenticated]

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        paid_total_subquery = (
            PaymentTransaction.objects.filter(
                enrollment_id=OuterRef("pk"),
                payment_status="success",
                is_deleted=False,
            )
            .order_by("-created_at")
            .values("total")[:1]
        )
        paid_currency_subquery = (
            PaymentTransaction.objects.filter(
                enrollment_id=OuterRef("pk"),
                payment_status="success",
                is_deleted=False,
            )
            .order_by("-created_at")
            .values("currency")[:1]
        )
        queryset = (
            Enrollment.objects.filter(user=self.request.user, is_deleted=False)
            .select_related("course", "course__category")
            .annotate(
                paid_total=Subquery(paid_total_subquery),
                paid_currency=Coalesce(Subquery(paid_currency_subquery, output_field=CharField()), Value("inr")),
            )
            .order_by("-enrolled_at")
        )
        if status_filter:
            queryset = queryset.filter(payment_status=status_filter)
        return queryset


class AdminEnrollmentsView(generics.ListAPIView):
    serializer_class = AdminEnrollmentSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        queryset = Enrollment.objects.select_related("user", "course").filter(is_deleted=False).order_by("-enrolled_at")
        status_filter = self.request.query_params.get("status")
        payment_status = self.request.query_params.get("payment_status")
        user_id = self.request.query_params.get("user_id")
        course_id = self.request.query_params.get("course_id")

        if status_filter in {"enrolled", "completed", "cancelled"}:
            queryset = queryset.filter(status=status_filter)
        if payment_status in {"success", "failed", "pending"}:
            queryset = queryset.filter(payment_status=payment_status)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class AdminEnrollmentDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    @staticmethod
    def _get_enrollment(enrollment_id: int):
        return Enrollment.objects.select_related("user", "course").filter(id=enrollment_id, is_deleted=False).first()

    def patch(self, request, enrollment_id: int):
        enrollment = self._get_enrollment(enrollment_id)
        if not enrollment:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminEnrollmentUpdateSerializer(enrollment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _bump_cache_version()
        _log_admin_action(request.user, "update_enrollment", "Enrollment", str(enrollment.id), enrollment.status)
        return Response(AdminEnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)

    def delete(self, request, enrollment_id: int):
        enrollment = self._get_enrollment(enrollment_id)
        if not enrollment:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "admin_soft_delete")
        record_soft_delete(enrollment, deleted_by=request.user, reason=reason)
        enrollment.is_deleted = True
        enrollment.save(update_fields=["is_deleted", "updated_at"])
        _bump_cache_version()
        _log_admin_action(request.user, "delete_enrollment", "Enrollment", str(enrollment.id), reason)
        return Response({"message": "Enrollment soft deleted."}, status=status.HTTP_200_OK)


class AdminReviewsView(generics.ListAPIView):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        queryset = Review.objects.select_related("user", "course").filter(is_deleted=False).order_by("-created_at")
        user_id = self.request.query_params.get("user_id")
        course_id = self.request.query_params.get("course_id")
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class AdminReviewDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    @staticmethod
    def _get_review(review_id: int):
        return Review.objects.select_related("user", "course").filter(id=review_id, is_deleted=False).first()

    def patch(self, request, review_id: int):
        review = self._get_review(review_id)
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminReviewUpdateSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _bump_cache_version()
        _log_admin_action(request.user, "update_review", "Review", str(review.id), str(review.rating))
        return Response(AdminReviewSerializer(review).data, status=status.HTTP_200_OK)

    def delete(self, request, review_id: int):
        review = self._get_review(review_id)
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "admin_soft_delete")
        record_soft_delete(review, deleted_by=request.user, reason=reason)
        review.is_deleted = True
        review.save(update_fields=["is_deleted", "updated_at"])
        _bump_cache_version()
        _log_admin_action(request.user, "delete_review", "Review", str(review.id), reason)
        return Response({"message": "Review soft deleted."}, status=status.HTTP_200_OK)


class AdminLessonListCreateView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        course_id = request.query_params.get("course_id")
        queryset = CourseLesson.objects.select_related("course").all().order_by("course_id", "module_number", "lesson_number")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        serializer = CourseLessonAdminSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CourseLessonAdminSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        _log_admin_action(
            request.user,
            "create_lms_lesson",
            "CourseLesson",
            str(lesson.id),
            f"course={lesson.course_id};module={lesson.module_number};lesson={lesson.lesson_number}",
        )
        return Response(CourseLessonAdminSerializer(lesson, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AdminLessonDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    @staticmethod
    def _get_lesson(lesson_id: int):
        return CourseLesson.objects.select_related("course").filter(id=lesson_id).first()

    def patch(self, request, lesson_id: int):
        lesson = self._get_lesson(lesson_id)
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseLessonAdminSerializer(lesson, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        _log_admin_action(request.user, "update_lms_lesson", "CourseLesson", str(updated.id), updated.title)
        return Response(CourseLessonAdminSerializer(updated, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, lesson_id: int):
        lesson = self._get_lesson(lesson_id)
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        lesson.delete()
        _log_admin_action(request.user, "delete_lms_lesson", "CourseLesson", str(lesson_id))
        return Response({"message": "Lesson deleted."}, status=status.HTTP_200_OK)


class LearnerLMSOverviewView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, course_id: int):
        course = Course.objects.filter(id=course_id, is_deleted=False, is_active=True).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)
        payload = _build_lms_payload(request.user, course)
        return Response(payload, status=status.HTTP_200_OK)


class LearnerLessonDetailView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, lesson_id: int):
        lesson = CourseLesson.objects.select_related("course").filter(id=lesson_id, is_active=True).first()
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, lesson.course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)

        payload = _build_lms_payload(request.user, lesson.course)
        unlocked_ids = {
            lesson_item["id"]
            for module in payload["modules"]
            for lesson_item in module["lessons"]
            if lesson_item["is_unlocked"]
        }
        completed_ids = {
            lesson_item["id"]
            for module in payload["modules"]
            for lesson_item in module["lessons"]
            if lesson_item["is_completed"]
        }

        return Response(
            {
                "id": lesson.id,
                "course_id": lesson.course_id,
                "module_number": lesson.module_number,
                "lesson_number": lesson.lesson_number,
                "title": lesson.title,
                "description": lesson.description,
                "video_url": lesson.video_url,
                "thumbnail_url": lesson.thumbnail_url,
                "pdf_url": lesson.pdf_url,
                "duration": lesson.duration,
                "media_token": _make_lesson_media_token(lesson.id),
                "is_unlocked": lesson.id in unlocked_ids,
                "is_completed": lesson.id in completed_ids,
            },
            status=status.HTTP_200_OK,
        )


class LearnerLessonPdfView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, lesson_id: int):
        lesson = CourseLesson.objects.select_related("course").filter(id=lesson_id, is_active=True).first()
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, lesson.course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)

        pdf_url = str(lesson.pdf_url or "").strip()
        if not pdf_url:
            return Response({"detail": "PDF not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            upstream = requests.get(pdf_url, timeout=25)
            upstream.raise_for_status()
        except requests.RequestException:
            return Response({"detail": "Unable to load PDF."}, status=status.HTTP_502_BAD_GATEWAY)

        response = HttpResponse(upstream.content, content_type="application/pdf")
        response["Content-Disposition"] = 'inline; filename="lesson.pdf"'
        response["Cache-Control"] = "no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class LearnerLessonVideoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, lesson_id: int):
        token = str(request.query_params.get("token") or "")
        if not _is_valid_lesson_media_token(token, lesson_id):
            return Response({"detail": "Invalid media token."}, status=status.HTTP_403_FORBIDDEN)

        lesson = CourseLesson.objects.filter(id=lesson_id, is_active=True).first()
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        video_url = str(lesson.video_url or "").strip()
        if not video_url:
            return Response({"detail": "Video not found."}, status=status.HTTP_404_NOT_FOUND)

        headers = {}
        range_header = request.headers.get("Range")
        if range_header:
            headers["Range"] = range_header

        try:
            upstream = requests.get(video_url, headers=headers, stream=True, timeout=25)
            upstream.raise_for_status()
        except requests.RequestException:
            return Response({"detail": "Unable to load video."}, status=status.HTTP_502_BAD_GATEWAY)

        response = StreamingHttpResponse(
            upstream.iter_content(chunk_size=1024 * 256),
            status=upstream.status_code,
            content_type=upstream.headers.get("Content-Type", "video/mp4"),
        )
        for header in ("Accept-Ranges", "Content-Length", "Content-Range"):
            value = upstream.headers.get(header)
            if value:
                response[header] = value
        response["Cache-Control"] = "no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class LearnerLessonThumbnailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, lesson_id: int):
        token = str(request.query_params.get("token") or "")
        if not _is_valid_lesson_media_token(token, lesson_id):
            return Response({"detail": "Invalid media token."}, status=status.HTTP_403_FORBIDDEN)

        lesson = CourseLesson.objects.filter(id=lesson_id, is_active=True).first()
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        thumbnail_url = str(lesson.thumbnail_url or "").strip()
        if not thumbnail_url:
            return Response({"detail": "Thumbnail not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            upstream = requests.get(thumbnail_url, timeout=25)
            upstream.raise_for_status()
        except requests.RequestException:
            return Response({"detail": "Unable to load thumbnail."}, status=status.HTTP_502_BAD_GATEWAY)

        response = HttpResponse(
            upstream.content,
            content_type=upstream.headers.get("Content-Type", "image/jpeg"),
        )
        response["Cache-Control"] = "no-store"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class LearnerLessonProgressView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def post(self, request, lesson_id: int):
        lesson = CourseLesson.objects.select_related("course").filter(id=lesson_id, is_active=True).first()
        if not lesson:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, lesson.course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)

        payload = _build_lms_payload(request.user, lesson.course)
        unlocked_ids = {
            lesson_item["id"]
            for module in payload["modules"]
            for lesson_item in module["lessons"]
            if lesson_item["is_unlocked"]
        }
        if lesson.id not in unlocked_ids:
            return Response({"detail": "This lesson is locked."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LessonProgressUpdateSerializer(
            data=request.data,
            context={"user": request.user, "lesson": lesson},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        refreshed = _build_lms_payload(request.user, lesson.course)
        flat_lessons = [l for module in refreshed["modules"] for l in module["lessons"]]
        current_index = next((idx for idx, item in enumerate(flat_lessons) if item["id"] == lesson.id), -1)
        next_lesson = flat_lessons[current_index + 1] if current_index >= 0 and (current_index + 1) < len(flat_lessons) else None
        next_locked = bool(next_lesson and not next_lesson["is_unlocked"])

        return Response(
            {
                "message": "Lesson marked as completed.",
                "progress_percent": refreshed["progress_percent"],
                "next_lesson_locked": next_locked,
                "next_lesson_id": next_lesson["id"] if next_lesson else None,
                "next_lesson_title": next_lesson["title"] if next_lesson else None,
                "overview": refreshed,
            },
            status=status.HTTP_200_OK,
        )


class AdminQuizListCreateView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        course_id = request.query_params.get("course_id")
        queryset = Quiz.objects.select_related("course").prefetch_related("questions__options").order_by("course_id", "module_number", "id")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        serializer = QuizAdminSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = QuizAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        if quiz.status == Quiz.STATUS_PUBLISHED:
            issues = _quiz_publish_issues(quiz)
            if issues:
                quiz.status = Quiz.STATUS_DRAFT
                quiz.is_active = False
                quiz.save(update_fields=["status", "is_active", "updated_at"])
                return Response({"detail": "Quiz is not ready to publish.", "issues": issues}, status=status.HTTP_400_BAD_REQUEST)
        _log_admin_action(request.user, "create_quiz", "Quiz", str(quiz.id), quiz.title)
        return Response(QuizAdminSerializer(quiz).data, status=status.HTTP_201_CREATED)


class AdminQuizDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    @staticmethod
    def _get_quiz(quiz_id: int):
        return Quiz.objects.select_related("course").prefetch_related("questions__options").filter(id=quiz_id).first()

    def patch(self, request, quiz_id: int):
        quiz = self._get_quiz(quiz_id)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = QuizAdminSerializer(quiz, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        if updated.status == Quiz.STATUS_PUBLISHED:
            issues = _quiz_publish_issues(updated)
            if issues:
                updated.status = Quiz.STATUS_DRAFT
                updated.is_active = False
                updated.save(update_fields=["status", "is_active", "updated_at"])
                return Response({"detail": "Quiz is not ready to publish.", "issues": issues}, status=status.HTTP_400_BAD_REQUEST)
        _log_admin_action(request.user, "update_quiz", "Quiz", str(updated.id), updated.title)
        return Response(QuizAdminSerializer(updated).data, status=status.HTTP_200_OK)

    def delete(self, request, quiz_id: int):
        quiz = self._get_quiz(quiz_id)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        quiz.delete()
        _log_admin_action(request.user, "delete_quiz", "Quiz", str(quiz_id))
        return Response({"message": "Quiz deleted."}, status=status.HTTP_200_OK)


class AdminQuizQuestionCreateView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, quiz_id: int):
        quiz = Quiz.objects.filter(id=quiz_id).first()
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        if quiz.questions.count() >= 50:
            return Response({"detail": "A quiz can have a maximum of 50 questions."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = QuizQuestionAdminSerializer(data={**request.data, "quiz": quiz.id})
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        _log_admin_action(request.user, "create_quiz_question", "QuizQuestion", str(question.id), quiz.title)
        return Response(QuizQuestionAdminSerializer(question).data, status=status.HTTP_201_CREATED)


class AdminQuizQuestionImportView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, quiz_id: int):
        quiz = Quiz.objects.filter(id=quiz_id).first()
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        csv_text = str(request.data.get("csv_text") or "").strip()
        if not csv_text:
            return Response({"detail": "CSV content is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rows = list(csv.DictReader(io.StringIO(csv_text)))
        except csv.Error:
            return Response({"detail": "Invalid CSV format."}, status=status.HTTP_400_BAD_REQUEST)

        required_columns = {"question", "option_1", "option_2", "option_3", "option_4", "correct_option"}
        if not rows or not required_columns.issubset(set(rows[0].keys())):
            return Response(
                {"detail": "CSV must include question, option_1, option_2, option_3, option_4, correct_option columns."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_count = quiz.questions.count()
        if existing_count + len(rows) > 50:
            return Response({"detail": "Import would exceed the 50 question limit."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []
        with transaction.atomic():
            for row_index, row in enumerate(rows, start=2):
                question_text = str(row.get("question") or "").strip()
                options = [str(row.get(f"option_{index}") or "").strip() for index in range(1, 5)]
                try:
                    correct_index = int(str(row.get("correct_option") or "").strip()) - 1
                except ValueError:
                    correct_index = -1
                try:
                    marks = int(str(row.get("marks") or "1").strip())
                except ValueError:
                    marks = 1

                if not question_text or any(not option for option in options) or correct_index not in range(4):
                    errors.append(f"Row {row_index}: fill question, 4 options, and correct_option 1-4.")
                    continue
                order = existing_count + len(created) + 1
                question = QuizQuestion.objects.create(quiz=quiz, question_text=question_text, marks=max(1, marks), order=order)
                for option_index, option_text in enumerate(options):
                    QuizOption.objects.create(
                        question=question,
                        option_text=option_text,
                        order=option_index + 1,
                        is_correct=option_index == correct_index,
                    )
                created.append(question)

            if errors:
                transaction.set_rollback(True)
                return Response({"detail": "CSV import failed.", "issues": errors}, status=status.HTTP_400_BAD_REQUEST)

        quiz.status = Quiz.STATUS_DRAFT
        quiz.is_active = False
        quiz.save(update_fields=["status", "is_active", "updated_at"])
        _log_admin_action(request.user, "import_quiz_questions", "Quiz", str(quiz.id), f"count={len(created)}")
        return Response({"message": f"Imported {len(created)} questions.", "quiz": QuizAdminSerializer(quiz).data}, status=status.HTTP_201_CREATED)


class AdminQuizQuestionDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    @staticmethod
    def _get_question(question_id: int):
        return QuizQuestion.objects.select_related("quiz").prefetch_related("options").filter(id=question_id).first()

    def patch(self, request, question_id: int):
        question = self._get_question(question_id)
        if not question:
            return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = QuizQuestionAdminSerializer(question, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        _log_admin_action(request.user, "update_quiz_question", "QuizQuestion", str(updated.id), updated.quiz.title)
        return Response(QuizQuestionAdminSerializer(updated).data, status=status.HTTP_200_OK)

    def delete(self, request, question_id: int):
        question = self._get_question(question_id)
        if not question:
            return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)
        question.delete()
        _log_admin_action(request.user, "delete_quiz_question", "QuizQuestion", str(question_id))
        return Response({"message": "Question deleted."}, status=status.HTTP_200_OK)


class LearnerQuizListView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, course_id: int):
        course = Course.objects.filter(id=course_id, is_deleted=False, is_active=True).first()
        if not course:
            return Response({"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)
        queryset = (
            Quiz.objects.filter(course=course, status=Quiz.STATUS_PUBLISHED, is_active=True, questions__is_active=True)
            .annotate(question_count=Count("questions", filter=Q(questions__is_active=True), distinct=True))
            .filter(question_count__gt=0)
            .prefetch_related("attempts")
            .order_by("module_number", "id")
        )
        serializer = LearnerQuizSummarySerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class LearnerQuizStartView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def post(self, request, quiz_id: int):
        quiz = (
            Quiz.objects.select_related("course")
            .prefetch_related("questions__options")
            .filter(id=quiz_id, status=Quiz.STATUS_PUBLISHED, is_active=True)
            .first()
        )
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, quiz.course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)

        existing_attempt = (
            QuizAttempt.objects.select_related("quiz")
            .prefetch_related("answers", "quiz__questions__options")
            .filter(user=request.user, quiz=quiz, status=QuizAttempt.STATUS_IN_PROGRESS)
            .order_by("-started_at")
            .first()
        )
        if existing_attempt:
            return Response(QuizAttemptSerializer(existing_attempt).data, status=status.HTTP_200_OK)

        questions = list(quiz.questions.filter(is_active=True).prefetch_related("options").order_by("order", "id")[: quiz.max_questions])
        if not questions:
            return Response({"detail": "No active questions are available for this quiz."}, status=status.HTTP_400_BAD_REQUEST)
        for question in questions:
            if question.options.count() != 4 or question.options.filter(is_correct=True).count() != 1:
                return Response({"detail": "This quiz is not ready. Please contact admin."}, status=status.HTTP_400_BAD_REQUEST)

        attempt_number = QuizAttempt.objects.filter(user=request.user, quiz=quiz, status=QuizAttempt.STATUS_SUBMITTED).count() + 1
        total_marks = sum(question.marks for question in questions)
        with transaction.atomic():
            attempt = QuizAttempt.objects.create(
                user=request.user,
                quiz=quiz,
                attempt_number=attempt_number,
                total_questions=len(questions),
                unanswered_count=len(questions),
                total_marks=total_marks,
            )
            QuizAttemptAnswer.objects.bulk_create([QuizAttemptAnswer(attempt=attempt, question=question) for question in questions])
        attempt = QuizAttempt.objects.select_related("quiz").prefetch_related("answers", "quiz__questions__options").get(id=attempt.id)
        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class LearnerQuizAttemptDetailView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def get(self, request, attempt_id: int):
        attempt = QuizAttempt.objects.select_related("quiz", "quiz__course").prefetch_related("answers", "quiz__questions__options").filter(
            id=attempt_id,
            user=request.user,
        ).first()
        if not attempt:
            return Response({"detail": "Quiz attempt not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _has_success_enrollment(request.user, attempt.quiz.course_id):
            return Response({"detail": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)
        serializer = QuizAttemptResultSerializer if attempt.status == QuizAttempt.STATUS_SUBMITTED else QuizAttemptSerializer
        return Response(serializer(attempt).data, status=status.HTTP_200_OK)


class LearnerQuizAnswerView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def post(self, request, attempt_id: int):
        attempt = QuizAttempt.objects.select_related("quiz").filter(id=attempt_id, user=request.user).first()
        if not attempt:
            return Response({"detail": "Quiz attempt not found."}, status=status.HTTP_404_NOT_FOUND)
        if attempt.status != QuizAttempt.STATUS_IN_PROGRESS:
            return Response({"detail": "This quiz attempt is already submitted."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = QuizAnswerSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question_id = serializer.validated_data["question_id"]
        selected_option_id = serializer.validated_data.get("selected_option_id")
        time_taken_seconds = serializer.validated_data.get("time_taken_seconds", 0)

        answer = QuizAttemptAnswer.objects.select_related("question").filter(attempt=attempt, question_id=question_id).first()
        if not answer:
            return Response({"detail": "Question does not belong to this attempt."}, status=status.HTTP_400_BAD_REQUEST)

        selected_option = None
        if selected_option_id:
            selected_option = QuizOption.objects.filter(id=selected_option_id, question_id=question_id).first()
            if not selected_option:
                return Response({"detail": "Selected option does not belong to this question."}, status=status.HTTP_400_BAD_REQUEST)

        answer.selected_option = selected_option
        answer.is_answered = bool(selected_option)
        answer.is_correct = bool(selected_option and selected_option.is_correct)
        answer.marks_awarded = answer.question.marks if answer.is_correct else 0
        answer.time_taken_seconds = time_taken_seconds
        answer.save(update_fields=["selected_option", "is_answered", "is_correct", "marks_awarded", "time_taken_seconds"])
        return Response(QuizAttemptAnswerSerializer(answer).data, status=status.HTTP_200_OK)


class LearnerQuizSubmitView(APIView):
    permission_classes = [IsActiveAuthenticated]

    def post(self, request, attempt_id: int):
        attempt = QuizAttempt.objects.select_related("quiz").prefetch_related("answers").filter(id=attempt_id, user=request.user).first()
        if not attempt:
            return Response({"detail": "Quiz attempt not found."}, status=status.HTTP_404_NOT_FOUND)
        if attempt.status == QuizAttempt.STATUS_SUBMITTED:
            return Response(QuizAttemptResultSerializer(attempt).data, status=status.HTTP_200_OK)

        answers = list(attempt.answers.all())
        answered_count = sum(1 for answer in answers if answer.is_answered)
        correct_count = sum(1 for answer in answers if answer.is_correct)
        score = sum(answer.marks_awarded for answer in answers)
        total_marks = attempt.total_marks or 0
        percentage = (Decimal(score) * Decimal("100") / Decimal(total_marks)).quantize(Decimal("0.01")) if total_marks else Decimal("0.00")
        now = timezone.now()
        time_taken_seconds = max(0, int((now - attempt.started_at).total_seconds())) if attempt.started_at else 0

        attempt.answered_count = answered_count
        attempt.unanswered_count = max(0, attempt.total_questions - answered_count)
        attempt.correct_count = correct_count
        attempt.wrong_count = max(0, answered_count - correct_count)
        attempt.score = score
        attempt.percentage = percentage
        attempt.is_passed = percentage >= Decimal(attempt.quiz.pass_percentage)
        attempt.time_taken_seconds = time_taken_seconds
        attempt.submitted_at = now
        attempt.status = QuizAttempt.STATUS_SUBMITTED
        attempt.save()
        return Response(QuizAttemptResultSerializer(attempt).data, status=status.HTTP_200_OK)


import hashlib

from django.core.cache import cache
from django.db.models import Avg, CharField, Count, Exists, FloatField, IntegerField, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsActiveAuthenticated, IsAdminUserRole
from analytics.models import AdminActivityLog
from config.pagination import StandardResultsSetPagination
from courses.models import Category, Course, Enrollment, Review, ReviewVote
from courses.serializers import (
    AdminEnrollmentSerializer,
    AdminEnrollmentUpdateSerializer,
    AdminReviewSerializer,
    AdminReviewUpdateSerializer,
    CategorySerializer,
    CourseSerializer,
    EnrollmentSerializer,
    ReviewSerializer,
)
from deleted_records.services import record_soft_delete

COURSE_CACHE_VERSION_KEY = "courses:cache_version"
CATEGORY_CACHE_TTL = 120
COURSE_CACHE_TTL = 60


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


def _log_admin_action(user, action: str, target_type: str, target_id: str, details: str = ""):
    if user and user.is_authenticated and user.is_admin:
        AdminActivityLog.objects.create(
            admin_user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )


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
        return queryset.order_by("-created_at")

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
        related_queryset = base_queryset.filter(category_id=course.category_id).order_by("-created_at")
        related_items = list(related_queryset[:limit_value])

        if len(related_items) < limit_value:
            existing_ids = [item.id for item in related_items]
            fallback_queryset = base_queryset.exclude(id__in=existing_ids).order_by("-created_at")
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
        queryset = (
            Enrollment.objects.filter(user=self.request.user, is_deleted=False)
            .select_related("course", "course__category")
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


from __future__ import annotations

import os
import re
from decimal import Decimal

from django.db.models import Avg
from django.utils import timezone
from rest_framework import serializers

from courses.models import (
    Category,
    Course,
    CourseLesson,
    Enrollment,
    Quiz,
    QuizAttempt,
    QuizAttemptAnswer,
    QuizOption,
    QuizQuestion,
    Review,
    ReviewVote,
    UserLessonProgress,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description", "is_deleted", "created_at")
        read_only_fields = ("id", "is_deleted", "created_at")


class CourseSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_deleted=False),
        source="category",
        write_only=True,
    )
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    highlight_title = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()
    is_purchased = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "category",
            "category_id",
            "title",
            "short_description",
            "description",
            "duration_days",
            "price",
            "final_price",
            "discount_percent",
            "discounted_price",
            "has_discount",
            "is_purchased",
            "can_review",
            "image",
            "is_active",
            "average_rating",
            "review_count",
            "highlight_title",
            "created_at",
        )

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        price = Decimal(str(attrs.get("price", getattr(instance, "price", 0)) or 0)).quantize(Decimal("0.01"))
        final_price = attrs.get("final_price", getattr(instance, "final_price", None))

        if final_price is None:
            return attrs

        normalized_final = Decimal(str(final_price)).quantize(Decimal("0.01"))
        if normalized_final < Decimal("0.00"):
            raise serializers.ValidationError({"final_price": "Final price cannot be negative."})
        if normalized_final > price:
            raise serializers.ValidationError({"final_price": "Final price cannot be greater than price."})

        attrs["final_price"] = normalized_final
        if price <= Decimal("0.00"):
            attrs["discount_percent"] = Decimal("0.00")
        else:
            discount_percent = ((price - normalized_final) * Decimal("100")) / price
            attrs["discount_percent"] = max(Decimal("0.00"), min(Decimal("100.00"), discount_percent.quantize(Decimal("0.01"))))
        return attrs

    def get_average_rating(self, obj):
        cached = getattr(obj, "avg_rating", None)
        if cached is not None:
            return round(cached, 2) if cached else 0
        rating = obj.reviews.filter(is_deleted=False).aggregate(avg=Avg("rating"))["avg"] or 0
        return round(rating, 2)

    def get_review_count(self, obj):
        cached = getattr(obj, "reviews_count", None)
        if cached is not None:
            return cached
        return obj.reviews.filter(is_deleted=False).count()

    def get_highlight_title(self, obj):
        query = self.context.get("search_query", "")
        if not query:
            return obj.title
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        return pattern.sub(lambda match: f"<mark>{match.group(0)}</mark>", obj.title)

    def get_discounted_price(self, obj):
        if obj.final_price is not None:
            return Decimal(str(obj.final_price)).quantize(Decimal("0.01"))
        price = Decimal(str(obj.price or 0))
        discount_percent = Decimal(str(obj.discount_percent or 0))
        discount_percent = max(Decimal("0"), min(Decimal("100"), discount_percent))
        discount_amount = (price * discount_percent / Decimal("100")).quantize(Decimal("0.01"))
        return (price - discount_amount).quantize(Decimal("0.01"))

    def get_has_discount(self, obj):
        return Decimal(str(obj.discount_percent or 0)) > 0

    def get_is_purchased(self, obj):
        cached = getattr(obj, "is_purchased_flag", None)
        if cached is not None:
            return bool(cached)

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        return Enrollment.objects.filter(
            user=user,
            course=obj,
            payment_status="success",
            is_deleted=False,
        ).exists()

    def get_can_review(self, obj):
        return self.get_is_purchased(obj)

    def validate_image(self, value):
        if not value:
            return value

        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        extension = os.path.splitext(value.name)[1].lower()
        if extension not in allowed_extensions:
            raise serializers.ValidationError("Invalid image type. Use JPG, PNG or WEBP.")

        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Image must be 5MB or smaller.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.ImageField(source="user.avatar", read_only=True)
    helpful_likes_count = serializers.SerializerMethodField()
    helpful_dislikes_count = serializers.SerializerMethodField()
    my_vote = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "course",
            "rating",
            "comment",
            "user_name",
            "user_avatar",
            "helpful_likes_count",
            "helpful_dislikes_count",
            "my_vote",
            "created_at",
        )
        read_only_fields = (
            "id",
            "user_name",
            "user_avatar",
            "helpful_likes_count",
            "helpful_dislikes_count",
            "my_vote",
            "created_at",
        )

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def get_helpful_likes_count(self, obj):
        cached = getattr(obj, "helpful_likes_count", None)
        if cached is not None:
            return int(cached)
        return obj.votes.filter(vote=ReviewVote.VOTE_LIKE).count()

    def get_helpful_dislikes_count(self, obj):
        cached = getattr(obj, "helpful_dislikes_count", None)
        if cached is not None:
            return int(cached)
        return obj.votes.filter(vote=ReviewVote.VOTE_DISLIKE).count()

    def get_my_vote(self, obj):
        if hasattr(obj, "my_vote_value"):
            return obj.my_vote_value

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None

        vote = obj.votes.filter(user=user).only("vote").first()
        return vote.vote if vote else None


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    paid_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    paid_currency = serializers.CharField(read_only=True)

    class Meta:
        model = Enrollment
        fields = ("id", "course", "status", "payment_status", "paid_total", "paid_currency", "enrolled_at")


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "user",
            "user_email",
            "course",
            "course_title",
            "status",
            "payment_status",
            "enrolled_at",
            "updated_at",
        )
        read_only_fields = fields


class AdminEnrollmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ("status", "payment_status")
        extra_kwargs = {
            "status": {"required": False},
            "payment_status": {"required": False},
        }


class AdminReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "user_email",
            "course",
            "course_title",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class AdminReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("rating", "comment")
        extra_kwargs = {
            "rating": {"required": False},
            "comment": {"required": False},
        }

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class CourseLessonAdminSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = CourseLesson
        fields = (
            "id",
            "course",
            "course_title",
            "module_number",
            "lesson_number",
            "title",
            "description",
            "video_url",
            "thumbnail_url",
            "pdf_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CourseLessonLearnerSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    is_unlocked = serializers.SerializerMethodField()

    class Meta:
        model = CourseLesson
        fields = (
            "id",
            "module_number",
            "lesson_number",
            "title",
            "description",
            "thumbnail_url",
            "is_active",
            "is_completed",
            "is_unlocked",
        )

    def get_is_completed(self, obj):
        completed_ids = self.context.get("completed_lesson_ids", set())
        return obj.id in completed_ids

    def get_is_unlocked(self, obj):
        unlocked_ids = self.context.get("unlocked_lesson_ids", set())
        return obj.id in unlocked_ids


class LessonProgressUpdateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=("complete", "skip"))

    def save(self, **kwargs):
        user = self.context["user"]
        lesson = self.context["lesson"]
        action = self.validated_data["action"]
        progress, _ = UserLessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson,
            defaults={"is_completed": False},
        )
        if action in {"complete", "skip"} and not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = timezone.now()
            progress.save(update_fields=["is_completed", "completed_at", "updated_at"])
        return progress


class QuizOptionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOption
        fields = ("id", "option_text", "is_correct", "order")
        read_only_fields = ("id",)


class QuizQuestionAdminSerializer(serializers.ModelSerializer):
    options = QuizOptionAdminSerializer(many=True)

    class Meta:
        model = QuizQuestion
        fields = ("id", "quiz", "question_text", "marks", "order", "is_active", "options", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {"quiz": {"required": False}}

    def validate_options(self, value):
        if len(value) != 4:
            raise serializers.ValidationError("Each question must have exactly 4 options.")
        correct_count = sum(1 for option in value if option.get("is_correct"))
        if correct_count != 1:
            raise serializers.ValidationError("Select exactly one correct option.")
        return value

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        question = QuizQuestion.objects.create(**validated_data)
        for index, option_data in enumerate(options_data, start=1):
            option_order = option_data.pop("order", None) or index
            QuizOption.objects.create(question=question, order=option_order, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            instance.options.all().delete()
            for index, option_data in enumerate(options_data, start=1):
                option_order = option_data.pop("order", None) or index
                QuizOption.objects.create(question=instance, order=option_order, **option_data)
        return instance


class QuizAdminSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    question_count = serializers.SerializerMethodField()
    active_question_count = serializers.SerializerMethodField()
    is_publish_ready = serializers.SerializerMethodField()
    publish_issues = serializers.SerializerMethodField()
    questions = QuizQuestionAdminSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = (
            "id",
            "course",
            "course_title",
            "module_number",
            "title",
            "description",
            "time_per_question_seconds",
            "pass_percentage",
            "max_questions",
            "status",
            "is_active",
            "question_count",
            "active_question_count",
            "is_publish_ready",
            "publish_issues",
            "questions",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "question_count",
            "active_question_count",
            "is_publish_ready",
            "publish_issues",
            "questions",
            "created_at",
            "updated_at",
        )

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_active_question_count(self, obj):
        return obj.questions.filter(is_active=True).count()

    def get_publish_issues(self, obj):
        issues = []
        active_questions = list(obj.questions.filter(is_active=True).prefetch_related("options"))
        if not active_questions:
            issues.append("Add at least 1 active question.")
        if len(active_questions) > 50:
            issues.append("Keep active questions at 50 or fewer.")
        for question in active_questions:
            options = list(question.options.all())
            if len(options) != 4:
                issues.append(f"Question {question.order} must have exactly 4 options.")
            if sum(1 for option in options if option.is_correct) != 1:
                issues.append(f"Question {question.order} must have exactly 1 correct option.")
        if obj.time_per_question_seconds < 5:
            issues.append("Set at least 5 seconds per question.")
        return issues

    def get_is_publish_ready(self, obj):
        return len(self.get_publish_issues(obj)) == 0


class QuizOptionLearnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOption
        fields = ("id", "option_text", "order")


class QuizQuestionLearnerSerializer(serializers.ModelSerializer):
    options = QuizOptionLearnerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ("id", "question_text", "marks", "order", "options")


class LearnerQuizSummarySerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    latest_attempt = serializers.SerializerMethodField()
    attempts_count = serializers.SerializerMethodField()
    is_done = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = (
            "id",
            "course",
            "module_number",
            "title",
            "description",
            "time_per_question_seconds",
            "pass_percentage",
            "question_count",
            "latest_attempt",
            "attempts_count",
            "is_done",
        )

    def get_latest_attempt(self, obj):
        attempt = obj.attempts.filter(user=self.context["request"].user, status=QuizAttempt.STATUS_SUBMITTED).order_by("-submitted_at").first()
        return QuizAttemptResultSerializer(attempt).data if attempt else None

    def get_attempts_count(self, obj):
        return obj.attempts.filter(user=self.context["request"].user, status=QuizAttempt.STATUS_SUBMITTED).count()

    def get_is_done(self, obj):
        return obj.attempts.filter(user=self.context["request"].user, is_passed=True, status=QuizAttempt.STATUS_SUBMITTED).exists()


class QuizAttemptAnswerSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source="question.id", read_only=True)
    selected_option_id = serializers.IntegerField(source="selected_option.id", read_only=True)

    class Meta:
        model = QuizAttemptAnswer
        fields = ("id", "question_id", "selected_option_id", "is_answered", "is_correct", "marks_awarded", "time_taken_seconds")


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    time_per_question_seconds = serializers.IntegerField(source="quiz.time_per_question_seconds", read_only=True)
    pass_percentage = serializers.IntegerField(source="quiz.pass_percentage", read_only=True)
    questions = serializers.SerializerMethodField()
    answers = QuizAttemptAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = (
            "id",
            "quiz",
            "quiz_title",
            "time_per_question_seconds",
            "pass_percentage",
            "attempt_number",
            "started_at",
            "submitted_at",
            "total_questions",
            "answered_count",
            "unanswered_count",
            "correct_count",
            "wrong_count",
            "total_marks",
            "score",
            "percentage",
            "is_passed",
            "time_taken_seconds",
            "status",
            "questions",
            "answers",
        )

    def get_questions(self, obj):
        questions = obj.quiz.questions.filter(is_active=True).prefetch_related("options").order_by("order", "id")[: obj.total_questions]
        return QuizQuestionLearnerSerializer(questions, many=True).data


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)

    class Meta:
        model = QuizAttempt
        fields = (
            "id",
            "quiz",
            "quiz_title",
            "attempt_number",
            "started_at",
            "submitted_at",
            "total_questions",
            "answered_count",
            "unanswered_count",
            "correct_count",
            "wrong_count",
            "total_marks",
            "score",
            "percentage",
            "is_passed",
            "time_taken_seconds",
            "status",
        )


class QuizAnswerSaveSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)
    time_taken_seconds = serializers.IntegerField(required=False, min_value=0)

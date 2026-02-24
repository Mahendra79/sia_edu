from __future__ import annotations

import os
import re
from decimal import Decimal

from django.db.models import Avg
from rest_framework import serializers

from courses.models import Category, Course, Enrollment, Review, ReviewVote


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
            "mentor_name",
            "mentor_title",
            "mentor_bio",
            "duration_days",
            "price",
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

    class Meta:
        model = Enrollment
        fields = ("id", "course", "status", "payment_status", "enrolled_at")


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

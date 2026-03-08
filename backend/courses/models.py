from django.db import models
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Course(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="courses")
    title = models.CharField(max_length=255, db_index=True)
    short_description = models.CharField(max_length=255)
    description = models.TextField()
    mentor_name = models.CharField(max_length=150, blank=True, default="")
    mentor_title = models.CharField(max_length=180, blank=True, default="")
    mentor_bio = models.TextField(blank=True, default="")
    duration_days = models.PositiveSmallIntegerField(
        default=30,
        help_text="Estimated learning plan duration in days.",
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage discount applied before tax.",
    )
    image = models.ImageField(upload_to="courses/images/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["title"]),
            models.Index(fields=["is_deleted", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.title


class Enrollment(models.Model):
    STATUS_CHOICES = (
        ("enrolled", "Enrolled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    PAYMENT_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="enrolled")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending", db_index=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        unique_together = ("user", "course")
        ordering = ["-enrolled_at"]
        indexes = [
            models.Index(fields=["payment_status"]),
            models.Index(fields=["user", "course"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} -> {self.course.title}"


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.course.title} ({self.rating})"


class ReviewVote(models.Model):
    VOTE_LIKE = "like"
    VOTE_DISLIKE = "dislike"
    VOTE_CHOICES = (
        (VOTE_LIKE, "Like"),
        (VOTE_DISLIKE, "Dislike"),
    )

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_votes")
    vote = models.CharField(max_length=8, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("review", "user")
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["review", "vote"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} -> {self.review_id}: {self.vote}"


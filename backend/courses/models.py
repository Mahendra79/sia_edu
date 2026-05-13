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


class CourseLesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    module_number = models.PositiveSmallIntegerField()
    lesson_number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_url = models.URLField(max_length=1200)
    thumbnail_url = models.URLField(max_length=1200, blank=True)
    pdf_url = models.URLField(max_length=1200, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["module_number", "lesson_number", "id"]
        unique_together = ("course", "module_number", "lesson_number")
        indexes = [
            models.Index(fields=["course", "is_active"]),
            models.Index(fields=["course", "module_number", "lesson_number"]),
        ]

    def __str__(self) -> str:
        return f"{self.course_id} M{self.module_number} L{self.lesson_number}"


class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress")
    lesson = models.ForeignKey(CourseLesson, on_delete=models.CASCADE, related_name="progress_items")
    is_completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "lesson")
        indexes = [
            models.Index(fields=["user", "is_completed"]),
            models.Index(fields=["user", "lesson"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} -> {self.lesson_id} ({self.is_completed})"


class Quiz(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_ARCHIVED, "Archived"),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="quizzes")
    module_number = models.PositiveSmallIntegerField(blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_per_question_seconds = models.PositiveSmallIntegerField(default=25)
    pass_percentage = models.PositiveSmallIntegerField(default=70, validators=[MinValueValidator(1), MaxValueValidator(100)])
    max_questions = models.PositiveSmallIntegerField(default=25, validators=[MinValueValidator(1), MaxValueValidator(25)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    is_active = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course_id", "module_number", "id"]
        indexes = [
            models.Index(fields=["course", "is_active"]),
            models.Index(fields=["course", "status", "is_active"]),
            models.Index(fields=["course", "module_number"]),
        ]

    def __str__(self) -> str:
        return f"{self.course_id}: {self.title}"


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    marks = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(100)])
    order = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        indexes = [
            models.Index(fields=["quiz", "is_active"]),
            models.Index(fields=["quiz", "order"]),
        ]

    def __str__(self) -> str:
        return f"Quiz {self.quiz_id} Q{self.order}"


class QuizOption(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name="options")
    option_text = models.CharField(max_length=1000)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["order", "id"]
        indexes = [
            models.Index(fields=["question", "order"]),
        ]

    def __str__(self) -> str:
        return f"Question {self.question_id} option {self.order}"


class QuizAttempt(models.Model):
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_SUBMITTED = "submitted"
    STATUS_EXPIRED = "expired"
    STATUS_CHOICES = (
        (STATUS_IN_PROGRESS, "In progress"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_EXPIRED, "Expired"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts")
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    attempt_number = models.PositiveSmallIntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    total_questions = models.PositiveSmallIntegerField(default=0)
    answered_count = models.PositiveSmallIntegerField(default=0)
    unanswered_count = models.PositiveSmallIntegerField(default=0)
    correct_count = models.PositiveSmallIntegerField(default=0)
    wrong_count = models.PositiveSmallIntegerField(default=0)
    total_marks = models.PositiveSmallIntegerField(default=0)
    score = models.PositiveSmallIntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_passed = models.BooleanField(default=False, db_index=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS, db_index=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["user", "quiz"]),
            models.Index(fields=["user", "quiz", "is_passed"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} quiz {self.quiz_id} attempt {self.attempt_number}"


class QuizAttemptAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name="attempt_answers")
    selected_option = models.ForeignKey(QuizOption, on_delete=models.SET_NULL, null=True, blank=True, related_name="attempt_answers")
    is_answered = models.BooleanField(default=False)
    is_correct = models.BooleanField(default=False)
    marks_awarded = models.PositiveSmallIntegerField(default=0)
    time_taken_seconds = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ("attempt", "question")
        indexes = [
            models.Index(fields=["attempt", "question"]),
        ]

    def __str__(self) -> str:
        return f"Attempt {self.attempt_id} question {self.question_id}"


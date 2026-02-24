from django.contrib import admin

from courses.models import Category, Course, Enrollment, Review, ReviewVote


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_deleted", "created_at")
    list_filter = ("is_deleted",)
    search_fields = ("name",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "price", "is_active", "is_deleted", "created_at")
    list_filter = ("is_active", "is_deleted", "category")
    search_fields = ("title", "short_description")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "status", "payment_status", "enrolled_at")
    list_filter = ("status", "payment_status", "is_deleted")
    search_fields = ("user__email", "course__title")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "course", "user", "rating", "is_deleted", "created_at")
    list_filter = ("rating", "is_deleted")
    search_fields = ("course__title", "user__email")


@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    list_display = ("id", "review", "user", "vote", "created_at")
    list_filter = ("vote",)
    search_fields = ("review__course__title", "user__email")


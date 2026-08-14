from django.contrib import admin

from courses.models import Category, Course, Enrollment, FreeCourse, FreeCourseLesson, FreeCourseModule, Review, ReviewVote


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


@admin.register(FreeCourse)
class FreeCourseAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "is_active", "is_deleted", "created_at")
    list_filter = ("is_active", "is_deleted")
    search_fields = ("title",)


@admin.register(FreeCourseModule)
class FreeCourseModuleAdmin(admin.ModelAdmin):
    list_display = ("id", "free_course", "module_number", "title", "created_at")
    list_filter = ("free_course",)
    search_fields = ("title", "free_course__title")


@admin.register(FreeCourseLesson)
class FreeCourseLessonAdmin(admin.ModelAdmin):
    list_display = ("id", "module", "lesson_number", "title", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("title", "module__title")


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


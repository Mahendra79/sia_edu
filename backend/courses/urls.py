from django.urls import path

from courses.views import (
    AdminEnrollmentDetailView,
    AdminEnrollmentsView,
    AdminReviewDetailView,
    AdminReviewsView,
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    CourseListCreateView,
    CourseRetrieveUpdateDestroyView,
    CourseReviewsView,
    MyEnrollmentsView,
    RelatedCoursesView,
    ReviewVoteView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="categories"),
    path("categories/<int:pk>/", CategoryRetrieveUpdateDestroyView.as_view(), name="category-detail"),
    path("", CourseListCreateView.as_view(), name="courses"),
    path("<int:pk>/", CourseRetrieveUpdateDestroyView.as_view(), name="course-detail"),
    path("<int:course_id>/related/", RelatedCoursesView.as_view(), name="course-related"),
    path("<int:course_id>/reviews/", CourseReviewsView.as_view(), name="course-reviews"),
    path("reviews/<int:review_id>/vote/", ReviewVoteView.as_view(), name="review-vote"),
    path("enrollments/me/", MyEnrollmentsView.as_view(), name="my-enrollments"),
    path("admin/enrollments/", AdminEnrollmentsView.as_view(), name="admin-enrollments"),
    path("admin/enrollments/<int:enrollment_id>/", AdminEnrollmentDetailView.as_view(), name="admin-enrollment-detail"),
    path("admin/reviews/", AdminReviewsView.as_view(), name="admin-reviews"),
    path("admin/reviews/<int:review_id>/", AdminReviewDetailView.as_view(), name="admin-review-detail"),
]

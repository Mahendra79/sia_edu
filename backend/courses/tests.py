from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course, Enrollment, Review, ReviewVote


class CourseApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Development", description="Development")
        self.active_course = Course.objects.create(
            category=self.category,
            title="Active Course",
            short_description="Active",
            description="Active description",
            price="99.00",
            is_active=True,
        )
        self.inactive_course = Course.objects.create(
            category=self.category,
            title="Inactive Course",
            short_description="Inactive",
            description="Inactive description",
            price="79.00",
            is_active=False,
        )
        self.deleted_course = Course.objects.create(
            category=self.category,
            title="Deleted Course",
            short_description="Deleted",
            description="Deleted description",
            price="49.00",
            is_active=True,
            is_deleted=True,
        )

    def test_scope_filters_include_only_requested_course_activity(self):
        active_response = self.client.get(reverse("courses"), {"scope": "active"})
        self.assertEqual(active_response.status_code, status.HTTP_200_OK)
        active_ids = {item["id"] for item in active_response.data["results"]}
        self.assertIn(self.active_course.id, active_ids)
        self.assertNotIn(self.inactive_course.id, active_ids)
        self.assertNotIn(self.deleted_course.id, active_ids)

        inactive_response = self.client.get(reverse("courses"), {"scope": "inactive"})
        self.assertEqual(inactive_response.status_code, status.HTTP_200_OK)
        inactive_ids = {item["id"] for item in inactive_response.data["results"]}
        self.assertIn(self.inactive_course.id, inactive_ids)
        self.assertNotIn(self.active_course.id, inactive_ids)
        self.assertNotIn(self.deleted_course.id, inactive_ids)

    def test_admin_can_update_course_is_active_flag(self):
        admin_user = User.objects.create_user(
            username="admin_courses",
            email="admin_courses@example.com",
            phone="7000000000",
            name="Courses Admin",
            password="StrongPass123!",
            is_staff=True,
        )
        self.client.force_authenticate(admin_user)

        response = self.client.patch(
            reverse("course-detail", kwargs={"pk": self.active_course.id}),
            {"is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.active_course.refresh_from_db()
        self.assertFalse(self.active_course.is_active)

    def test_review_submission_requires_successful_purchase(self):
        learner = User.objects.create_user(
            username="learner_no_purchase",
            email="learner_no_purchase@example.com",
            phone="7111111111",
            name="No Purchase Learner",
            password="StrongPass123!",
        )
        self.client.force_authenticate(learner)

        response = self.client.post(
            reverse("course-reviews", kwargs={"course_id": self.active_course.id}),
            {"rating": 5, "comment": "Great course"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Review.objects.count(), 0)

    def test_purchased_student_can_create_review(self):
        learner = User.objects.create_user(
            username="learner_with_purchase",
            email="learner_with_purchase@example.com",
            phone="7222222222",
            name="Purchased Learner",
            password="StrongPass123!",
        )
        Enrollment.objects.create(
            user=learner,
            course=self.active_course,
            payment_status="success",
            status="enrolled",
            is_deleted=False,
        )
        self.client.force_authenticate(learner)

        response = self.client.post(
            reverse("course-reviews", kwargs={"course_id": self.active_course.id}),
            {"rating": 4, "comment": "Useful and practical"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        review = Review.objects.get(user=learner, course=self.active_course)
        self.assertEqual(review.rating, 4)
        self.assertEqual(review.comment, "Useful and practical")

    def test_course_reviews_endpoint_is_paginated(self):
        author = User.objects.create_user(
            username="review_batch_author",
            email="review_batch_author@example.com",
            phone="7666666666",
            name="Batch Author",
            password="StrongPass123!",
        )
        for index in range(12):
            reviewer = User.objects.create_user(
                username=f"reviewer_{index}",
                email=f"reviewer_{index}@example.com",
                phone=f"78{index:08d}",
                name=f"Reviewer {index}",
                password="StrongPass123!",
            )
            Review.objects.create(
                user=reviewer,
                course=self.active_course,
                rating=4,
                comment=f"Review {index}",
            )

        response = self.client.get(reverse("course-reviews", kwargs={"course_id": self.active_course.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 12)
        self.assertEqual(len(response.data["results"]), 10)

    def test_related_courses_endpoint(self):
        other_category = Category.objects.create(name="Marketing", description="Marketing courses")
        related_course = Course.objects.create(
            category=self.category,
            title="Related Development Course",
            short_description="Related",
            description="Related description",
            price="69.00",
            is_active=True,
        )
        fallback_course = Course.objects.create(
            category=other_category,
            title="Fallback Marketing Course",
            short_description="Fallback",
            description="Fallback description",
            price="59.00",
            is_active=True,
        )

        response = self.client.get(
            reverse("course-related", kwargs={"course_id": self.active_course.id}),
            {"limit": 2},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_ids = [item["id"] for item in response.data]
        self.assertIn(related_course.id, response_ids)
        self.assertNotIn(self.active_course.id, response_ids)
        self.assertIn(fallback_course.id, response_ids)

    def test_review_vote_requires_authentication(self):
        author = User.objects.create_user(
            username="review_author",
            email="review_author@example.com",
            phone="7333333333",
            name="Review Author",
            password="StrongPass123!",
        )
        review = Review.objects.create(
            user=author,
            course=self.active_course,
            rating=5,
            comment="Excellent course",
        )

        response = self.client.post(
            reverse("review-vote", kwargs={"review_id": review.id}),
            {"vote": "like"},
            format="json",
        )

        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertEqual(ReviewVote.objects.count(), 0)

    def test_review_vote_toggle_and_switch(self):
        author = User.objects.create_user(
            username="review_author_switch",
            email="review_author_switch@example.com",
            phone="7444444444",
            name="Switch Author",
            password="StrongPass123!",
        )
        voter = User.objects.create_user(
            username="review_voter",
            email="review_voter@example.com",
            phone="7555555555",
            name="Review Voter",
            password="StrongPass123!",
        )
        review = Review.objects.create(
            user=author,
            course=self.active_course,
            rating=4,
            comment="Strong practical examples",
        )
        self.client.force_authenticate(voter)

        like_response = self.client.post(
            reverse("review-vote", kwargs={"review_id": review.id}),
            {"vote": "like"},
            format="json",
        )
        self.assertEqual(like_response.status_code, status.HTTP_200_OK)
        self.assertEqual(like_response.data["my_vote"], "like")
        self.assertEqual(like_response.data["helpful_likes_count"], 1)
        self.assertEqual(like_response.data["helpful_dislikes_count"], 0)

        toggle_response = self.client.post(
            reverse("review-vote", kwargs={"review_id": review.id}),
            {"vote": "like"},
            format="json",
        )
        self.assertEqual(toggle_response.status_code, status.HTTP_200_OK)
        self.assertIsNone(toggle_response.data["my_vote"])
        self.assertEqual(toggle_response.data["helpful_likes_count"], 0)
        self.assertEqual(toggle_response.data["helpful_dislikes_count"], 0)

        dislike_response = self.client.post(
            reverse("review-vote", kwargs={"review_id": review.id}),
            {"vote": "dislike"},
            format="json",
        )
        self.assertEqual(dislike_response.status_code, status.HTTP_200_OK)
        self.assertEqual(dislike_response.data["my_vote"], "dislike")
        self.assertEqual(dislike_response.data["helpful_likes_count"], 0)
        self.assertEqual(dislike_response.data["helpful_dislikes_count"], 1)

        switch_response = self.client.post(
            reverse("review-vote", kwargs={"review_id": review.id}),
            {"vote": "like"},
            format="json",
        )
        self.assertEqual(switch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(switch_response.data["my_vote"], "like")
        self.assertEqual(switch_response.data["helpful_likes_count"], 1)
        self.assertEqual(switch_response.data["helpful_dislikes_count"], 0)
        self.assertEqual(ReviewVote.objects.filter(review=review, user=voter).count(), 1)


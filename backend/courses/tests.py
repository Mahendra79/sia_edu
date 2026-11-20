from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Category, Course, CourseLesson, Enrollment, Review, ReviewVote, UserLessonProgress


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


class LmsSequentialUnlockTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Development", description="Development")
        self.course = Course.objects.create(
            category=self.category,
            title="Sequential Course",
            short_description="Sequential",
            description="Sequential description",
            price="99.00",
            is_active=True,
        )
        self.lessons = [
            CourseLesson.objects.create(
                course=self.course,
                module_number=1,
                lesson_number=lesson_number,
                title=f"Lesson {lesson_number}",
                video_url="https://example.com/video.mp4",
                is_active=True,
            )
            for lesson_number in range(1, 6)
        ]
        self.learner = User.objects.create_user(
            username="sequential_learner",
            email="sequential_learner@example.com",
            phone="7999999999",
            name="Sequential Learner",
            password="StrongPass123!",
        )
        Enrollment.objects.create(
            user=self.learner,
            course=self.course,
            payment_status="success",
            status="enrolled",
            is_deleted=False,
        )
        self.client.force_authenticate(self.learner)

    def _lesson_flags(self, response):
        flags = {}
        for module in response.data["modules"]:
            for lesson in module["lessons"]:
                if isinstance(lesson["id"], int):
                    flags[lesson["id"]] = (lesson["is_unlocked"], lesson["is_completed"])
        return flags

    def test_only_first_lesson_unlocked_initially(self):
        response = self.client.get(reverse("learner-lms-overview", kwargs={"course_id": self.course.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        flags = self._lesson_flags(response)

        self.assertEqual(flags[self.lessons[0].id], (True, False))
        for lesson in self.lessons[1:]:
            self.assertEqual(flags[lesson.id], (False, False))

    def test_completing_a_lesson_unlocks_the_next_one(self):
        progress_url = reverse("learner-lesson-progress", kwargs={"lesson_id": self.lessons[0].id})
        response = self.client.post(progress_url, {"action": "complete"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        overview_response = self.client.get(reverse("learner-lms-overview", kwargs={"course_id": self.course.id}))
        flags = self._lesson_flags(overview_response)

        self.assertEqual(flags[self.lessons[0].id], (True, True))
        self.assertEqual(flags[self.lessons[1].id], (True, False))
        for lesson in self.lessons[2:]:
            self.assertEqual(flags[lesson.id], (False, False))

    def test_locked_lesson_cannot_be_marked_complete(self):
        progress_url = reverse("learner-lesson-progress", kwargs={"lesson_id": self.lessons[2].id})
        response = self.client.post(progress_url, {"action": "complete"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_preexisting_completion_is_grandfathered_in(self):
        UserLessonProgress.objects.create(user=self.learner, lesson=self.lessons[4], is_completed=True)

        response = self.client.get(reverse("learner-lms-overview", kwargs={"course_id": self.course.id}))
        flags = self._lesson_flags(response)

        self.assertEqual(flags[self.lessons[0].id], (True, False))
        self.assertEqual(flags[self.lessons[1].id], (False, False))
        self.assertEqual(flags[self.lessons[2].id], (False, False))
        self.assertEqual(flags[self.lessons[3].id], (False, False))
        self.assertEqual(flags[self.lessons[4].id], (True, True))



class LearnerQuizAttemptTests(APITestCase):
    def setUp(self):
        from courses.models import Quiz, QuizOption, QuizQuestion

        category = Category.objects.create(name="Quantum", description="Quantum")
        self.course = Course.objects.create(
            category=category,
            title="Quiz Course",
            short_description="Quiz",
            description="Quiz description",
            price="99.00",
            is_active=True,
        )
        self.quiz = Quiz.objects.create(
            course=self.course,
            title="Gates Quiz",
            time_per_question_seconds=30,
            pass_percentage=50,
            status=Quiz.STATUS_PUBLISHED,
            is_active=True,
        )
        self.correct_options = {}
        self.wrong_options = {}
        for index in range(1, 3):
            question = QuizQuestion.objects.create(
                quiz=self.quiz,
                question_text=f"Question {index}",
                order=index,
                explanation=f"Because answer {index}.",
            )
            for option_index in range(4):
                option = QuizOption.objects.create(
                    question=question,
                    option_text=f"Q{index} option {option_index}",
                    order=option_index,
                    is_correct=option_index == 1,
                )
                if option_index == 1:
                    self.correct_options[question.id] = option
                elif option_index == 0:
                    self.wrong_options[question.id] = option
        self.learner = User.objects.create_user(
            username="quiz_learner",
            email="quiz_learner@example.com",
            phone="7888888888",
            name="Quiz Learner",
            password="StrongPass123!",
        )
        Enrollment.objects.create(user=self.learner, course=self.course, payment_status="success", status="enrolled")
        self.client.force_authenticate(self.learner)

    def _start(self):
        response = self.client.post(reverse("learner-quiz-start", args=[self.quiz.id]))
        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        return response.data

    def _answer(self, attempt_id, question_id, option_id):
        return self.client.post(
            reverse("learner-quiz-answer", args=[attempt_id]),
            {"question_id": question_id, "selected_option_id": option_id, "time_taken_seconds": 5},
            format="json",
        )

    def test_start_does_not_leak_correct_answers_or_explanations(self):
        attempt = self._start()
        for answer in attempt["answers"]:
            self.assertIsNone(answer["correct_option_id"])
            self.assertIsNone(answer["is_correct"])
            self.assertEqual(answer["explanation"], "")
        for question in attempt["questions"]:
            self.assertNotIn("explanation", question)
            for option in question["options"]:
                self.assertNotIn("is_correct", option)

    def test_answer_reveals_feedback_and_then_locks(self):
        attempt = self._start()
        question_id = attempt["questions"][0]["id"]
        wrong = self.wrong_options[question_id]
        correct = self.correct_options[question_id]

        first = self._answer(attempt["id"], question_id, wrong.id)
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["correct_option_id"], correct.id)
        self.assertFalse(first.data["is_correct"])
        self.assertEqual(first.data["explanation"], "Because answer 1.")

        second = self._answer(attempt["id"], question_id, correct.id)
        self.assertEqual(second.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(second.data["answer"]["selected_option_id"], wrong.id)

        resumed = self._start()
        self.assertEqual(resumed["id"], attempt["id"])
        locked = next(answer for answer in resumed["answers"] if answer["question_id"] == question_id)
        self.assertTrue(locked["is_locked"])
        self.assertEqual(locked["correct_option_id"], correct.id)

    def test_answers_rejected_after_deadline(self):
        from datetime import timedelta

        from django.utils import timezone

        from courses.models import QuizAttempt

        attempt = self._start()
        QuizAttempt.objects.filter(id=attempt["id"]).update(started_at=timezone.now() - timedelta(minutes=10))
        question_id = attempt["questions"][0]["id"]
        response = self._answer(attempt["id"], question_id, self.correct_options[question_id].id)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "attempt_expired")

        resumed = self._start()
        self.assertTrue(resumed["is_expired"])

        submitted = self.client.post(reverse("learner-quiz-submit", args=[attempt["id"]]))
        self.assertEqual(submitted.status_code, status.HTTP_200_OK)
        # Time taken is capped at the attempt's budget (2 questions x 30s + grace).
        self.assertLessEqual(submitted.data["time_taken_seconds"], 2 * 30 + QuizAttempt.DEADLINE_GRACE_SECONDS)

    def test_submit_returns_per_question_review(self):
        attempt = self._start()
        first_id, second_id = (question["id"] for question in attempt["questions"])
        self._answer(attempt["id"], first_id, self.correct_options[first_id].id)
        self._answer(attempt["id"], second_id, None)

        response = self.client.post(reverse("learner-quiz-submit", args=[attempt["id"]]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_passed"])
        self.assertEqual(response.data["correct_count"], 1)
        self.assertEqual(response.data["unanswered_count"], 1)
        review = {item["question_id"]: item for item in response.data["review"]}
        self.assertTrue(review[first_id]["is_correct"])
        self.assertFalse(review[second_id]["is_answered"])
        self.assertEqual(review[second_id]["correct_option_text"], self.correct_options[second_id].option_text)

import { Router } from 'express';
import { addLectureToCourseById, createCourse, getAllCourses, getLecturesByCourseId, removeCourse, updateCourse, removeLectureFromCourse } from '../controllers/courseController.js';
import { isLoggedIn, authorizedRoles, authorizedSubscribers } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/multerMiddleware.js';


const router = new Router();

router.route('/')
        .get(getAllCourses)
        .post(
                isLoggedIn,
                authorizedRoles('ADMIN'),
                upload.single('thumbnail'),
                createCourse
        )
        .delete(isLoggedIn, authorizedRoles('ADMIN'), removeLectureFromCourse);

router.route('/:id')
        .get(isLoggedIn, authorizedSubscribers, getLecturesByCourseId)
        .put(
                isLoggedIn,
                authorizedRoles('ADMIN'),
                updateCourse
        )
        .delete(
                isLoggedIn,
                authorizedRoles('ADMIN'),
                removeCourse
        )
        .post(
                isLoggedIn,
                authorizedRoles('ADMIN'),
                upload.single('lecture'),
                addLectureToCourseById
        );

export default router;
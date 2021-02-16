import firebase from 'firebase'
import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '../views/Home.vue'

import Exercise from '../views/Exercises/Exercise.vue'
import NewExercise from '../views/Exercises/NewExercise.vue'
import EditExercise from '../views/Exercises/EditExercise.vue'
import ViewExercise from '../views/Exercises/ViewExercise.vue'
import ViewAllExercises from '../views/Exercises/ViewAllExercises.vue'
import ViewExercises from '../views/Exercises/ViewExercises.vue'

import Workout from '../views/Workouts/Workout.vue'
import NewWorkout from '../views/Workouts/NewWorkout.vue'
import EditWorkout from '../views/Workouts/EditWorkout.vue'
import ViewWorkout from '../views/Workouts/ViewWorkout.vue'
import ViewWorkouts from '../views/Workouts/ViewWorkouts.vue'

import Burn from '../views/Burn/Burn.vue'
import BurnHome from '../views/Burn/BurnHome.vue'
import RecentBurn from '../views/Burn/RecentBurn.vue'

import Profile from '../views/Users/Profile.vue'
import ViewProfile from '../views/Users/ViewProfile.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/signup',
    name: 'Sign Up',
    component: () => import(/*webpackChunkName: "signup" */ '../views/SignUp.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/*webpackChunkName: "login" */ '../views/Login.vue')
  },
  {
    path: '/exercises',
    name: 'Exercises',
    component: Exercise,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/exercises/new',
        name: 'New Exercise',
        component: NewExercise
      },
      {
        path: '/exercises/discover',
        name: 'ViewAllExercises',
        component: ViewAllExercises
      },
      {
        path: '/exercises/:exerciseid',
        name: 'View Exercise',
        component: ViewExercise
      },
      {
        path: '/exercises/:exerciseid/edit',
        name: 'Edit Exercise',
        component: EditExercise
      },
      {
        path: '/exercises',
        name: 'View Exercises',
        component: ViewExercises
      },    
    ]
  },
  {
    path: '/workouts',
    name: 'Workouts',
    component: Workout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/workouts/new',
        name: 'New Workout',
        component: NewWorkout
      },
      {
        path: '/workouts/:workoutid',
        name: 'View Workout',
        component: ViewWorkout
      },
      {
        path: '/workouts/:workoutid/edit',
        name: 'Edit Workout',
        component: EditWorkout
      },
      {
        path: '/workouts',
        name: 'View Workouts',
        component: ViewWorkouts
      }
    ]
  },
  {
    path: '/burn',
    name: 'Burn',
    component: Burn,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/burn',
        name: 'Burn Home',
        component: BurnHome
      },
      {
        path: '/burn/recent',
        name: 'RecentBurn.vue',
        component: RecentBurn
      }
    ]
  },
  {
    path: '/:profileid',
    name: 'Profile',
    component: Profile,
    children: [
      {
        path: '/:profileid',
        name: 'ViewProfile',
        component: ViewProfile
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// This function checks if user is logged in based on route metadata.
// Calls a promise in firebase.js to wait for user to log in (if on initial load).
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(x => x.meta.requiresAuth)

  if (requiresAuth && !await firebase.getCurrentUser()) {
    next('login')
  } else {
    next()
  }

  next();
})

export default router

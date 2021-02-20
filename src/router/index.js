import firebase from 'firebase'
import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '@/views/Home.vue'

import Exercise from '@/views/Exercise/Exercise.vue'
import ExerciseNew from '@/views/Exercise/ExerciseNew.vue'
import ExerciseEdit from '@/views/Exercise/ExerciseEdit.vue'
import ExerciseView from '@/views/Exercise/ExerciseView.vue'
import ExerciseDiscover from '@/views/Exercise/ExerciseDiscover.vue'
import ExerciseFollowed from '@/views/Exercise/ExerciseFollowed.vue'

import Workout from '@/views/Workout/Workout.vue'
import WorkoutNew from '@/views/Workout/WorkoutNew.vue'
import WorkoutEdit from '@/views/Workout/WorkoutEdit.vue'
import WorkoutView from '@/views/Workout/WorkoutView.vue'
import WorkoutFollowed from '@/views/Workout/WorkoutFollowed.vue'

import Burn from '@/views/Burn/Burn.vue'
import BurnHome from '@/views/Burn/BurnHome.vue'
import RecentBurn from '@/views/Burn/RecentBurn.vue'

import Profile from '@/views/User/Profile.vue'
import ProfileView from '@/views/User/ProfileView.vue'

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
        component: ExerciseNew
      },
      {
        path: '/exercises/discover',
        name: 'Discover Exercises',
        component: ExerciseDiscover
      },
      {
        path: '/exercises/:exerciseid',
        name: 'View Exercise',
        component: ExerciseView
      },
      {
        path: '/exercises/:exerciseid/edit',
        name: 'Edit Exercise',
        component: ExerciseEdit
      },
      {
        path: '/exercises',
        name: 'View Exercises',
        component: ExerciseFollowed
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
        component: WorkoutNew
      },
      {
        path: '/workouts/:workoutid',
        name: 'View Workout',
        component: WorkoutView
      },
      {
        path: '/workouts/:workoutid/edit',
        name: 'Edit Workout',
        component: WorkoutEdit
      },
      {
        path: '/workouts',
        name: 'View Workouts',
        component: WorkoutFollowed
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
        name: 'Recent Burn.vue',
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
        name: 'View Profile',
        component: ProfileView
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

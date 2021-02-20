<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container v-if="!isLoading">
            <h1 align="center">Discover Workouts</h1>
            <WorkoutFeed :workouts="workouts" />
            <div align="center"><v-btn @click="loadMoreWorkouts" :loading="isLoadingMore">Load More</v-btn></div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'
import WorkoutFeed from '@/components/Workout/WorkoutFeed'

export default {
    name: 'WorkoutDiscover',
    components: { WorkoutFeed },
    data() {
        return {
            isLoading: true,
            isLoadingMore: false,
            workouts: [],
            lastLoadedWorkout: null,
        }
    },

    created: function() {
        db.collection("workouts").orderBy("createdAt", "desc").limit(5).get().then(workoutsSnapshot => {
            workoutsSnapshot.forEach(workout => {
                let data = { createdAt: workout.data().createdAt, createdBy: workout.data().createdBy, id: workout.id }
                this.workouts.push(data);
            })

            this.isLoading = false;
            this.lastLoadedWorkout = workoutsSnapshot.docs[workoutsSnapshot.size - 1];
        })
    },

    mounted: function() {
        this.checkScroll();
    },

    methods: {
        checkScroll: function() {
            window.onscroll = () => {
                let bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight;
                
                if (bottomOfWindow) {
                    this.loadMoreWorkouts();
                }
            }
        },

        loadMoreWorkouts: function() {
            this.isLoadingMore = true;

            db.collection("workouts").orderBy("createdAt", "desc").startAfter(this.lastLoadedWorkout).limit(5).get().then(workoutsSnapshot => {
                workoutsSnapshot.forEach(workout => {
                    let data = { createdAt: workout.data().createdAt, createdBy: workout.data().createdBy, id: workout.id }
                    this.workouts.push(data);
                })

                this.isLoadingMore = false;
                this.lastLoadedWorkout = workoutsSnapshot.docs[workoutsSnapshot.size - 1];
            })
        }
    }
}
</script>
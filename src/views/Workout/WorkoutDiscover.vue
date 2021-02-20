<template>
    <v-sheet rounded="lg" min-height="70vh">
        <v-container v-if="!isLoading">
            <h1 align="center">Discover Workouts</h1>
            <WorkoutFeed :workoutObjs="workoutObjs" />
            <div align="center" v-if="moreToLoad"><v-btn text @click="loadMoreWorkouts" :loading="isLoadingMore">Load More</v-btn></div>
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
            moreToLoad: true,
            workoutObjs: [],
            lastLoadedWorkout: null,
        }
    },

    created: function() {
        db.collection("workouts").orderBy("createdAt", "desc").limit(5).get().then(workoutsSnapshot => {
            workoutsSnapshot.forEach(workout => {
                let d = workout.data();
                d.id = workout.id;
                this.workoutObjs.push(d);
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
                if (this.moreToLoad) {
                    let bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight;
                    
                    if (bottomOfWindow) {
                        console.log("bottom");
                        this.loadMoreWorkouts();
                    }
                }
            }
        },

        loadMoreWorkouts: function() {
            this.isLoadingMore = true;

            db.collection("workouts").orderBy("createdAt", "desc").startAfter(this.lastLoadedWorkout).limit(5).get().then(workoutsSnapshot => {
                workoutsSnapshot.forEach(workout => {
                    let d = workout.data();
                    d.id = workout.id;
                    this.workoutObjs.push(d);
                })

                if (workoutsSnapshot.size < 5) {
                    this.moreToLoad = false;
                }

                this.isLoadingMore = false;
                this.lastLoadedWorkout = workoutsSnapshot.docs[workoutsSnapshot.size - 1];
            })
        }
    }
}
</script>
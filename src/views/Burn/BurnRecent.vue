<template>
    <v-sheet rounded="lg">
        <v-container v-if="!isLoading">
            <h1 align="center">Recent Burns</h1>
            <BurnComponent v-for="recentWorkout in recentWorkouts" :recentWorkout="recentWorkout" :key="recentWorkout.rId" />
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '@/firebase'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import BurnComponent from '@/components/Burn/BurnComponent.vue'

export default {
    name: 'RecentBurn',
    components: { BurnComponent },
    data() {
        return {
            isLoading: true,
            recentWorkouts: []
        }
    },

    created: function() {
        dayjs.extend(relativeTime);

        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("burns").orderBy("createdAt", "desc").get()
        .then(recentWorkoutsSnapshot => {
            recentWorkoutsSnapshot.forEach(recentWorkout => {
                let d = recentWorkout.data();
                d.id = recentWorkout.id;
                d.createdAtText = dayjs(dayjs.unix(d.createdAt.seconds)).fromNow();
                this.recentWorkouts.push(d);
            })

            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading burns.", e);
        })
    }
}
</script>
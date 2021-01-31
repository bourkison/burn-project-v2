<template>
    <v-sheet class="mainSheet" rounded="lg">
        <v-container v-if="!isLoading">
            <v-card>
                <v-row class="headerRow" align="center" justify="center">
                    <v-col cols="12" sm="6">
                        <h2 align="left">{{ workoutData.name }}</h2>
                        <router-link :to="'/profile' + workoutData.createdBy.username">{{ workoutData.createdBy.username }}</router-link>
                    </v-col>
                    <v-col cols="12" sm="6">

                    </v-col>
                </v-row>
            </v-card>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db } from '../../firebase'

export default {
    name: 'ViewWorkout',
    data() {
        return {
            isLoading: true,
            workoutData: {}
        }
    },

    created: function() {
        this.downloadWorkout();
    },

    beforeRouteUpdate: function() {
        this.downloadWorkout();
    },

    methods: {
        downloadWorkout: function() {
            db.collection("workouts").doc(this.$route.params.workoutid).get().then(workoutDoc => {
                if (workoutDoc.exists) {
                    this.workoutData = workoutDoc.data();

                    // Then download exercise data.
                    this.isLoading = false;
                }
            })
        }
    }
}
</script>

<style scoped>
    .headerRow {
        padding: 10px 10px 10px 20px;
    }
</style>
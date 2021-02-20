<template>
    <v-card v-if="!isLoading" class="workoutMin" outlined>
        <v-container>
            <v-sheet align="center">
                <v-row>
                    <v-col cols="12" sm="6">
                        <router-link :to="'/workouts/' + userWorkoutData.id"><h2 align="left">{{ workoutData.name }}</h2></router-link>
                    </v-col>
                </v-row>
            </v-sheet>
            <div align="left" style="margin:0 auto;">
                <CommentSection
                    :workout-id="this.$props.userWorkoutData.id"
                    :is-liked="isLiked"
                    :like-count="workoutData.likeCount"
                    :recentComments="workoutData.recentComments"
                    :commentCount="workoutData.commentCount"
                    :followCount="workoutData.followCount"
                    :followableComponent="true"
                    @likeToggle="likeToggle"
                ></CommentSection>
            </div>
        </v-container>
    </v-card>
    <v-card v-else min-height="500" outlined>
        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </v-card>
</template>

<script>
import { db } from '@/firebase'
import CommentSection from '@/components/Comment/CommentSection'

export default {

    name: 'WorkoutComponent',
    components: { CommentSection },
    props: {
        userWorkoutData: {
            required: true,
            type: Object
        }
    },

    data() {
        return {
            isLoading: true,
            workoutData: {},
            isLiked: ''
        }
    },

    created: function() {
        db.collection("workouts").doc(this.$props.userWorkoutData.id).get().then(workoutDoc => {
            this.workoutData = workoutDoc.data();

            // Check if the user has liked.
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$props.userWorkoutData.id).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
                this.isLoading = false;
            })
        }).catch(e => {
            console.log("Error downloading workout", e);
        })
    },

    methods: {
        likeToggle: function(s) {
            if (s) {
                this.workoutData.likeCount ++;
            } else {
                this.workoutData.likeCount --;
            }

            this.isLiked = s;
        }
    }
}
</script>

<style scoped>
    .workoutMin {
        box-shadow: none !important;
        margin-bottom: 25px;
    }

    .workoutMin a {
        text-decoration: none;
        color: #fff;
    }
</style>
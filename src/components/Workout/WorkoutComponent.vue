<template>
    <v-card v-if="!isLoading" class="workoutMin" outlined>
        <v-container>
            <v-sheet align="center">
                <v-row>
                    <v-col cols="12" sm="6">
                        <router-link :to="'/workouts/' + workoutData.id"><h2 align="left">{{ workoutData.name }}</h2></router-link>
                    </v-col>
                </v-row>
            </v-sheet>
            <div align="left" style="margin:0 auto;">
                <CommentSection
                    :workoutId="workoutData.id"
                    :is-liked="isLiked"
                    :likeCount="likeCount"
                    :recentComments="workoutData.recentComments"
                    :commentCount="commentCount"
                    :followCount="followCount"
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
        workoutId: {
            required: false,
            type: String
        },
        workoutObj: {
            required: false,
            type: Object
        }
    },

    data() {
        return {
            isLoading: true,
            workoutData: {},
            isLiked: '',

            // Counters:
            likeCount: 0,
            commentCount: 0,
            followCount: 0
        }
    },

    mounted: function() {
        // As we sometimes get passed an ID, and sometimes the whole object.
        // (Whole object in Workout Discover, ID in WorkoutFollowed )
        // We do this hack with Promises to account for both cases.
        let promises = [];

        if (this.$props.workoutObj) {
            this.workoutData = this.$props.workoutObj;
        } else {
            promises.push(db.collection("workouts").doc(this.$props.workoutId).get().then(workoutDoc => {
                let d = workoutDoc.data();
                d.id = workoutDoc.id;
                this.workoutData = d;
            }))
        }

        Promise.all(promises).then(() => {
            // Pull like, comment and follow count.
            return db.collection("workouts").doc(this.workoutData.id).collection("counters").get() 
        })
        .then(counterSnapshot => {
            counterSnapshot.forEach(counter => {
                this.likeCount += counter.data().likeCount;
                this.commentCount += counter.data().commentCount;
                this.followCount += counter.data().followCount;
            })

            return this.checkIfUserLiked();
        })
        .then(() => {
            this.isLoading = false;
        })
        .catch(e => {
            console.error("Error downloading workout", e);
        })
    },

    methods: {
        checkIfUserLiked: function() {
            // Check if the user has liked.
            return db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.workoutData.id).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            })
        },

        likeToggle: function(s) {
            if (s) {
                this.likeCount ++;
            } else {
                this.likeCount --;
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
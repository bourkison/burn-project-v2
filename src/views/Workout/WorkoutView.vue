<template>
    <v-sheet class="mainSheet" rounded="lg">
        <v-container v-if="!isLoading && workoutExists">
            <v-card>
                <v-row class="headerRow" align="center" justify="center">
                    <v-col cols="12" sm="6">
                        <h2 align="left">{{ workoutData.name }}</h2>
                        <router-link :to="'/' + workoutData.createdBy.username">{{ workoutData.createdBy.username }}</router-link>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div align="right">
                            <v-icon v-for="star in workoutData.difficulty" color="yellow darken-2" :key="star">mdi-star</v-icon>    
                            <v-menu :offset-y="true">
                                <template v-slot:activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on">mdi-dots-vertical</v-icon>
                                </template>
                                <v-list>
                                    <v-list-item @click="editWorkout" v-if="workoutData.createdBy.id == $store.state.userProfile.data.uid" selectable>Edit</v-list-item>
                                    <v-list-item @click.stop="isDeletingDialogue = true" v-if="workoutData.createdBy.id == $store.state.userProfile.data.uid" color="error" selectable>Delete</v-list-item>
                                    <v-list-item @click="reportWorkout" color="error" selectable>Report</v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </v-col>
                </v-row>
            </v-card>
            <v-card>
                <v-sheet align="center">
                    <v-container class="mdOutput" v-html="compiledMarkdown"></v-container>
                </v-sheet>
            </v-card>
            <v-card>
                <v-expansion-panels>
                    <ExerciseExpandable v-for="exercise in workoutData.exercises" :key="exercise.id" :exerciseToDownload="exercise"></ExerciseExpandable>
                </v-expansion-panels>
            </v-card>
            <div align="center" style="margin-top:25px;">
                <v-btn color="success" @click="startWorkout"><v-icon>mdi-plus</v-icon>Start Workout</v-btn>
            </div>
            <v-card style="margin-top: 10px;">
                <CommentSection
                    :workout-id="this.$route.params.workoutid"
                    :is-liked="isLiked"
                    :likeCount="likeCount"
                    :recentComments="workoutData.recentComments"
                    :commentCount="commentCount"
                    :followCount="followCount"
                    :followableComponent="true"
                    @likeToggle="likeToggle"
                ></CommentSection>
            </v-card>

            <!-- Delete Confirm Dialog -->
            <v-dialog
                v-if="workoutData.createdBy.id == $store.state.userProfile.data.uid"
                v-model="isDeletingDialogue"
                width="500"
                persistent
            >
                <v-card>
                    <v-card-title>Delete?</v-card-title>
                    <v-card-text>Are you sure you want to delete? You can not un-delete.</v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="isDeletingDialogue = false" v-if="!isDeleting">Cancel</v-btn>
                        <v-btn text color="error" @click="deleteWorkout" :loading="isDeleting">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <!-- End Delete Dialogue -->
        </v-container>
        <v-container v-else-if="!workoutExists && !isLoading">
            <div>404 Not Found.</div>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, functions } from '@/firebase'
import * as marked from 'marked'

import CommentSection from '@/components/Comment/CommentSection.vue'
import ExerciseExpandable from '@/components/Exercise/ExerciseExpandable.vue'

export default {
    name: 'WorkoutView',
    components: { CommentSection, ExerciseExpandable },
    data() {
        return {
            isLoading: true,
            isDeleting: false,
            workoutData: {},
            workoutExists: false,
            isLiked: '',

            // Counters:
            likeCount: 0,
            commentCount: 0,
            followCount: 0,

            // Vuetify:
            isDeletingDialogue: false,
        }
    },

    created: function() {
        this.downloadWorkout();
    },

    beforeRouteUpdate: function() {
        this.downloadWorkout();
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.workoutData.description);
        }
    },

    methods: {
        downloadWorkout: function() {
            db.collection("workouts").doc(this.$route.params.workoutid).get()
            .then(workoutDoc => {
                if (workoutDoc.exists) {
                    this.workoutData = workoutDoc.data();
                    this.workoutExists = true;

                    // Pull like, comment and follow count.
                    return db.collection("workouts").doc(this.$route.params.workoutid).collection("counters").get()           
                } else {
                    this.workoutExists = false;
                    this.isLoading = false;

                    throw new Error("Workout does not exist");
                }
            })
            .then(counterSnapshot => {
                counterSnapshot.forEach(counter => {
                    this.likeCount += counter.data().likeCount;
                    this.commentCount += counter.data().commentCount;
                    this.followCount += counter.data().followCount;
                })

                // Check if the user has liked.
                return this.checkIfLiked();
            })
            .then(() => {
                this.isLoading = false;
            })
            .catch(e => {
                console.error("Error downloading workout", e);
            })
        },

        checkIfLiked: function() {
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$route.params.workoutid).get().then(likeSnapshot => {
                likeSnapshot.forEach(like => {
                    if (like.exists) {
                        this.isLiked = like.id;
                    }
                })
            })
        },

        likeToggle: function(s) {
            if (s) {
                this.workoutData.likeCount ++;
            } else {
                this.workoutData.likeCount --;
            }

            this.isLiked = s;
        },

        startWorkout: function() {
            this.$router.push({ path: '/burn', query: { w: this.$route.params.workoutid } });
        },

        editWorkout: function() {
            this.$router.push("/workouts/" + this.$route.params.workoutid + "/edit");
        },

        deleteWorkout: function() {
            this.isDeleting = true;
            let deleteFunction = functions.httpsCallable("deleteCollection");
            let path = "workouts/" + this.$route.params.workoutid;

            deleteFunction({ path: path }).then(result => {
                console.log("Success:", result);
                this.isDeleting = false;
                this.isDeletingDialogue = false;
                this.$router.push("/workouts");
            }).catch(e => {
                console.log("Failure", e)
            })
        },

        reportWorkout: function() {
            console.log("Report");
        }
    }
}
</script>

<style scoped>
    .headerRow {
        padding: 10px 10px 10px 20px;
    }
</style>
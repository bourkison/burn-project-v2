<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <v-form @submit.prevent="updateExercise">
                <h1>{{ newExerciseData.name }}</h1>
                <v-text-field v-model="newExerciseData.name" :rules=[rules.required] label="Exercise Name"></v-text-field>
                <ExerciseImageUploader :initImages="oldExerciseData.imgPaths" @editImgFiles="editImgFiles"></ExerciseImageUploader>
                <MarkdownInput :starting-text="oldExerciseData.description" @update-text="updateDescription"></MarkdownInput>
                <v-row>
                    <v-col cols="12" sm="6">
                        <MuscleGroupSelect :selectedMgs="oldExerciseData.muscleGroups" @mgCH="updateMgs"></MuscleGroupSelect>
                        <DifficultySelector :initialDifficulty="oldExerciseData.difficulty" @setDifficulty="setDifficulty"></DifficultySelector>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-card style="margin-top:10px;" align="center" outlined>
                            <v-container class="setsAdder">
                                <h2>Suggested Sets</h2>
                                <v-row v-for="set in newExerciseData.suggestedSets" :key="set.id" align="center" justify="center" style="border-bottom: 1px solid var(--v-secondary-base);">
                                    <v-col cols="12" xl="6" sm="12">
                                        <v-select :items="measureByOptions" v-model="set.measureBy"></v-select>
                                    </v-col>
                                    <v-col cols="12" xl="5" sm="10">
                                        <v-text-field v-if="set.measureBy == 'Time'" label="Suggested Time (secs)" :rules=[rules.isNumber] v-model="set.measureAmount"></v-text-field>
                                        <v-text-field v-if="set.measureBy == 'Reps'" label="Suggested Reps" :rules=[rules.isNumber] v-model="set.measureAmount"></v-text-field>
                                    </v-col>

                                    <v-col cols="12" xl="1" sm="2">
                                        <v-icon width="100%" @click="deleteSet(set.id)" color="error">mdi-close</v-icon>
                                    </v-col>
                                </v-row>
                                <v-btn @click="addSet" style="margin-top: 25px;">Add Set</v-btn>
                            </v-container>
                        </v-card>
                    </v-col>
                </v-row>
                <div class="text-center" style="margin-top:10px;"><v-btn type="submit" :loading="isUpdating" :disabled="isUpdating">Update Exercise</v-btn></div>
            </v-form>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, storage } from '../../firebase'

import ExerciseImageUploader from '../../components/Exercise/ExerciseImageUploader.vue'
import DifficultySelector from '../../components/DifficultySelector.vue'
import MarkdownInput from '../../components/MarkdownInput.vue'
import MuscleGroupSelect from '../../components/MuscleGroupSelect.vue'

export default {
    name: 'EditExercise',
    components: { ExerciseImageUploader, DifficultySelector, MarkdownInput, MuscleGroupSelect },
    data() {
        return {
            isLoading: true,
            isUpdating: false,
            oldExerciseData: {},
            newExerciseData: {},
            imgUrls: [],
            setIterator: 0,

            imageObjs: [],
            additionalFiles: [],
            imagesToDelete: [],

            // Firebase:
            downloadImageCounter: 0,
            imageChecker: 0,

            // Vuetify:
            measureByOptions: ["Time", "Reps"],
            rules: {
                required: value => !!value || 'Required.',
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },
    created: function() {
        this.downloadExercise()
    },
    beforeRouteUpdate: function() {
        this.downloadExercise();
    },
    methods: {
        downloadExercise: function() {
            db.collection("exercises").doc(this.$route.params.exerciseid).get().then(exerciseDoc => {
                if (exerciseDoc.exists) {
                    this.oldExerciseData = exerciseDoc.data();
                    this.newExerciseData = exerciseDoc.data();

                    // Set suggested sets
                    this.newExerciseData.suggestedSets.forEach(s => {
                        s.id = this.setIterator;
                        this.setIterator ++;
                    })

                    // Download images:
                    this.newExerciseData.imgPaths.forEach(img => {
                        storage.ref(img).getDownloadURL().then(url => {
                            this.imgUrls.push({ id: this.downloadImageCounter, imgUrl: url });
                            this.downloadImageCounter ++;
                        })
                    })
                } else {
                    this.isLoading = false;
                    console.log("Error, this exercise does not exist.");
                }
            }).catch(e => {
                console.log("Error downloading exercise.", e);
                this.isLoading = false;
            })
        },

        updateExercise: function() {
            this.isUpdating = true;

            if (this.imagesToDelete.length > 0) {
                this.imagesToDelete.forEach(path => {
                    storage.ref(path).delete().catch(e => {
                        console.log("Error deleting image at path", e);
                    });
                })
            }

            let i = 0;
            // First step, check for additional images, then upload them.
            this.imageObjs.forEach(imageObj => {
                if (imageObj.file) {
                    this.uploadImage(imageObj.file, i);
                } else {
                    this.imageChecker ++;
                }

                i ++;
            })
        },

        uploadImage: function(file, order) {
            let imageRef = storage.ref("exercises/" + this.$route.params.exerciseid + "/images/" + Number(new Date()) + "-" + this.generateId(4));

            imageRef.putString(file, 'data_url').then(() => {
                this.imageObjs[order].path = imageRef.fullPath;
                this.imageChecker ++;
            })
        },

        addSet: function() {
            this.setIterator ++;
            this.newExerciseData.suggestedSets.push({ id: this.setIterator, measureBy: this.newExerciseData.suggestedSets[this.newExerciseData.suggestedSets.length - 1].measureBy })
        },

        deleteSet: function(i) {
            if (this.newExerciseData.suggestedSets.length > 1) {
                let index = this.newExerciseData.suggestedSets.findIndex(x => x.id === i);
                this.newExerciseData.suggestedSets.splice(index, 1);
            }
        },

        setDifficulty: function(d) {
            this.newExerciseData.difficulty = d;
        },

        updateDescription: function(t) {
            this.newExerciseData.description = t;
        },

        updateMgs: function(mg) {
            this.newExerciseData.muscleGroups = mg;
        },

        editImgFiles: function(arr, del) {
            this.imageObjs = arr;
            this.imagesToDelete = del;
        },

        generateId(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        }
    },

    watch: {
        downloadImageCounter: function() {
            if (this.downloadImageCounter >= this.newExerciseData.imgPaths.length) {
                this.isLoading = false;
            }
        },

        imageChecker: function() {
            if (this.imageChecker >= this.imageObjs.length) {
                // First we need to build out the imgPaths array.
                this.newExerciseData.imgPaths = [];

                this.imageObjs.forEach(img => {
                    this.newExerciseData.imgPaths.push(img.path);
                })

                // Next, remove ID from the suggested sets.
                this.newExerciseData.suggestedSets.forEach(s => {
                    delete s.id;
                })

                db.collection("exercises").doc(this.$route.params.exerciseid).update(this.newExerciseData).then(() => {
                    this.isUpdating = false;
                    this.$router.push("/exercises/" + this.$route.params.exerciseid);
                }).catch(e => {
                    console.log("Error updating exexrcise", e);
                    this.isUpdating = false;
                });
            }
        }
    }
}
</script>
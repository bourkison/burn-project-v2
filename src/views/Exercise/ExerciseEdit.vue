<template>
    <v-sheet>
        <v-container v-if="!isLoading">
            <v-form @submit.prevent="updateExercise">
                <h1>{{ newExerciseData.name }}</h1>
                <v-text-field v-model="newExerciseData.name" :rules=[rules.required] label="Exercise Name"></v-text-field>
                <ExerciseImageUploader :initImages="oldExerciseData.filePaths" @editImgFiles="editImgFiles"></ExerciseImageUploader>
                <MarkdownInput :starting-text="oldExerciseData.description" @update-text="updateDescription"></MarkdownInput>
                <v-row>
                    <v-col cols="12" sm="6">
                        <MuscleGroupSelect :selectedMgs="oldExerciseData.muscleGroups" @mgCH="updateMgs"></MuscleGroupSelect>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <!-- <v-card style="margin-top:10px;" align="center" outlined>
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
                        </v-card> -->
                        <v-card class="measureBySelect" align="center" outlined>
                            <v-container>
                                <h3>Measure By
                                    <v-tooltip top offset-y>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-icon small v-bind="attrs" v-on="on">mdi-help-circle-outline</v-icon>
                                        </template>
                                        <span>Choose how this exercise is measured.</span>
                                    </v-tooltip>
                                </h3>
                                <v-select :items="['Reps', 'Time']" v-model="newExerciseData.measureBy"></v-select>
                            </v-container>
                        </v-card>
                        <DifficultySelector class="difficultySelect" :initialDifficulty="oldExerciseData.difficulty" @setDifficulty="setDifficulty" />
                        <v-card class="tagSelect" outlined>
                            <TagSelect :initialTags="oldExerciseData.tags" @updateTags="updateTags" />
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
import { db, storage, functions } from '@/firebase'

import ExerciseImageUploader from '@/components/Exercise/ExerciseImageUploader.vue'
import DifficultySelector from '@/components/Utility/DifficultySelector.vue'
import TagSelect from '@/components/Utility/TagSelect.vue'
import MarkdownInput from '@/components/Utility/MarkdownInput.vue'
import MuscleGroupSelect from '@/components/Utility/MuscleGroupSelect.vue'

export default {
    name: 'ExerciseEdit',
    components: { ExerciseImageUploader, DifficultySelector, MarkdownInput, MuscleGroupSelect, TagSelect },
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

                    // Download images:
                    let imageDownloadPromises = [];
                    this.newExerciseData.filePaths.forEach(img => {
                        imageDownloadPromises.push(storage.ref(img).getDownloadURL())
                    })

                    Promise.all(imageDownloadPromises)
                    .then(urls => {
                        let i = 0;
                        urls.forEach(url => {
                            this.imgUrls.push({ id: i, imgUrl: url });
                            i ++;
                        })

                        this.isLoading = false;
                    })
                    .catch(e => {
                        console.error("Error downloading images", e);
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

            // First delete images. This can be done asynchronously.
            if (this.imagesToDelete.length > 0) {
                this.imagesToDelete.forEach(path => {
                    storage.ref(path).delete().catch(e => {
                        console.log("Error deleting image at path", e);
                    });
                })
            }

            // Next, check for additional images to upload and push them to array of promises.
            let i = 0;
            let imageUploadPromises = []

            this.imageObjs.forEach(imageObj => {
                if (imageObj.file) {
                    const imageRef = storage.ref("exercises/" + this.$route.params.exerciseid + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                    this.imageObjs[i].path = imageRef.fullPath;
                    imageUploadPromises.push(imageRef.putString(imageObj.file, 'data_url'))

                    i ++;
                } else {
                    i ++;
                }
            })

            // Once all images are uploaded, update the document.
            Promise.all(imageUploadPromises)
            .then(() => {
                this.newExerciseData.filePaths = [];

                this.imageObjs.forEach(img => {
                    this.newExerciseData.filePaths.push(img.path);
                })

                this.newExerciseData.id = this.$route.params.exerciseid;

                const editExercise = functions.httpsCallable("editExercise");
                return editExercise({ exerciseForm: this.newExerciseData })
            })
            .then(result => {
                this.$router.push("/exercises/" + result.data.id);
                this.isUpdating = false;
            })
            .catch(e => {
                console.error("Error updating document", e);
                this.isUpdating = false;
            })
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

        updateTags: function(tags) {
            this.newExerciseData.tags = tags;
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
    }
}
</script>

<style scoped>
    .measureBySelect,
    .difficultySelect,
    .tagSelect {
        margin-top: 10px;
    }
</style>
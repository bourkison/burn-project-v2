<!-- 
    exercise: 
    {
        name: string,
        description: string,
        muscleGroups: array of strings, // Lists all muscle groups he exercise targets.
        suggestedMeasure: string, // Suggested way to calculate exercise (i.e. reps, reps and weight, time, etc)
        suggestedSets: object, // Suggested reps/sets.
        difficulty: integer,
        imgUrl: array of URL strings,
        videoSrc: video src string,
        createdBy: userId,
        createdAt: Timestamp
    }
-->

<template>
    <v-sheet>
        <v-container>
            <h1 align="center">{{ exerciseForm.name ? exerciseForm.name : 'New Exercise' }}</h1>
            <v-form @submit.prevent="createExercise">
                <v-text-field
                    v-model="exerciseForm.name"
                    label="Exercise Name"
                    :rules=[rules.required]
                ></v-text-field>
                <ExerciseImageUploader @updateImgFiles="updateImgFiles"></ExerciseImageUploader>
                <MarkdownInput @update-text="updateDescription"></MarkdownInput>
                <v-row align="center" justify="center">
                    <v-col cols="12" md="6"><MuscleGroupSelect @mgCH="updateMgs"></MuscleGroupSelect></v-col>
                    <v-col cols="12" md="6">
                        <v-card align="center" outlined>
                            <SuggestedSetsSelector @updateSets="updateSets"></SuggestedSetsSelector>
                        </v-card>
                        <DifficultySelector class="difficultyCard" @setDifficulty="setDifficulty"></DifficultySelector>
                    </v-col>
                </v-row>
                <div class="text-center"><v-btn type="submit" :loading="isCreating">Create Exercise</v-btn></div>
            </v-form>
        </v-container>
    </v-sheet>
</template>

<script>
import { functions, storage } from '@/firebase'

import ExerciseImageUploader from '@/components/Exercise/ExerciseImageUploader.vue'
import MarkdownInput from '@/components/MarkdownInput.vue'
import DifficultySelector from '@/components/DifficultySelector.vue'
import MuscleGroupSelect from '@/components/MuscleGroupSelect.vue'
import SuggestedSetsSelector from '@/components/Exercise/SuggestedSetsSelector.vue'

export default {
    name: 'ExerciseNew',
    components: { ExerciseImageUploader, MarkdownInput, MuscleGroupSelect, DifficultySelector, SuggestedSetsSelector },
    data() {
        return {
            exerciseForm: {
                name: '',
                description: '',
                muscleGroups: [],
                difficulty: 1,
                imgPaths: [],
                suggestedSets: [{id: 0}],
                videoSrc: ''
            },
            isCreating: false,
            imageFiles: [],
            imgIterator: 0,
            setIterator: 0,
            errorMessage: '',

            // Firebase:
            idAttempts: 0,
            imagesUploaded: 0,

            // Vuetify:
            model: 0,
            rules: {
                required: value => !!value || 'Required.',
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },

    methods: {
        createExercise: function() {
            this.isCreating = true;

            // First upload the image files.
            let imageUploadPromises = [];
            this.imageFiles.forEach(img => {
                let imageRef = storage.ref("exercises/" + this.exerciseForm.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                imageUploadPromises.push(imageRef.putString(img, 'data_url'));
                this.exerciseForm.imgPaths.push(imageRef.fullPath);
            })

            // Once images are all uploaded successfully, create the document.
            Promise.all(imageUploadPromises)
            .then(() => {
                const createExercise = functions.httpsCallable("createExercise");
                const user = { username: this.$store.state.userProfile.docData.username, profilePhotoUrl: this.$store.state.userProfile.docData.profilePhotoUrl };

                createExercise({ exerciseForm: this.exerciseForm, imageFiles: this.imageFiles, user: user })
                .then(result => {
                    this.isCreating = false;
                    console.log(result);
                    this.$router.push("/exercises/" + result.data.id);
                })
                .catch(e => {
                    console.log("Error creating document:", e);
                    this.isCreating = false;
                })
            })
            .catch(e => {
                console.log("Error uploading images", e);
                this.isCreating = false;
            })
        },

        generateId: function(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },

        updateDescription: function(t) {
            this.exerciseForm.description = t;
        },

        setDifficulty: function(d) {
            this.exerciseForm.difficulty = d;
        },

        updateMgs: function(mg) {
            this.exerciseForm.muscleGroups = mg;
        },

        updateSets: function (sets) {
            this.exerciseForm.suggestedSets = sets;
        },

        updateImgFiles: function (arr) {
            this.imageFiles = [];
            arr.forEach(img => {
                this.imageFiles.push(img.file);
            })
        }
    }
}
</script>

<style scoped>
    input {
        margin-bottom: 10px;
    }

    button {
        margin: 10px 0 5px;
    }

    .imageUpload,
    .difficultyCard {
        margin-top: 10px;
    }

    .imageUpload .v-input {
        padding-left: 10px;
        padding-right: 10px;
        margin-top: 10px;
    }

    .setsAdder .v-icon {
        right: 10px;
    }
</style>
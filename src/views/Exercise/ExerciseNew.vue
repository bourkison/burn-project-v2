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
                <ExerciseImageUploader @updateImgFiles="updateImgFiles" />
                <MarkdownInput @update-text="updateDescription"></MarkdownInput>
                <v-row align="center" justify="center">
                    <v-col cols="12" md="6"><MuscleGroupSelect @mgCH="updateMgs" /></v-col>
                    <v-col cols="12" md="6">
                        <v-card align="center" outlined>
                            <v-container>
                                <h3>Measure By
                                    <v-tooltip top offset-y>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-icon small v-bind="attrs" v-on="on">mdi-help-circle-outline</v-icon>
                                        </template>
                                        <span>Choose how this exercise is measured.</span>
                                    </v-tooltip>
                                </h3>
                                <v-select :items="['Reps', 'Time']" v-model="exerciseForm.measureBy"></v-select>
                            </v-container>
                        </v-card>
                        <DifficultySelector class="difficultyCard" @setDifficulty="setDifficulty" />
                        <v-card class="tagCard" align="center" outlined>
                            <TagSelect @updateTags="updateTags"/>
                        </v-card>
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
import MuscleGroupSelect from '@/components/Utility/MuscleGroupSelect.vue'
import TagSelect from '@/components/Utility/TagSelect.vue'

export default {
    name: 'ExerciseNew',
    components: { ExerciseImageUploader, MarkdownInput, MuscleGroupSelect, DifficultySelector, TagSelect },
    data() {
        return {
            exerciseForm: {
                name: '',
                description: '',
                muscleGroups: [],
                difficulty: 1,
                filePaths: [],
                measureBy: 'Reps',
                tags: []
            },
            isCreating: false,
            imageFiles: [],
            imgIterator: 0,
            setIterator: 0,
            errorMessage: '',

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


            this.exerciseForm.id = '';
            this.exerciseForm.id += this.exerciseForm.name.replace(/[^A-Za-z0-9]/g, "").substring(0, 8).toLowerCase();
            if (this.exerciseForm.id.length > 0) {
                this.exerciseForm.id += '-';
            }
            this.exerciseForm.id += this.generateId(16 - this.exerciseForm.id.length);

            // First upload the image files.
            let imageUploadPromises = [];
            this.imageFiles.forEach(img => {
                let imageRef = storage.ref("exercises/" + this.exerciseForm.id + "/images/" + Number(new Date()) + "-" + this.generateId(4));
                imageUploadPromises.push(imageRef.putString(img, 'data_url'));
                this.exerciseForm.filePaths.push(imageRef.fullPath);
            })

            // Once images are all uploaded successfully, create the document.
            Promise.all(imageUploadPromises)
            .then(() => {
                const createExercise = functions.httpsCallable("createExercise");
                const user = { username: this.$store.state.userProfile.docData.username, profilePhoto: this.$store.state.userProfile.docData.profilePhoto };

                createExercise({ exerciseForm: this.exerciseForm, user: user })
                .then(result => {
                    this.isCreating = false;
                    console.log(result);
                    this.$router.push("/exercises/" + result.data.id);
                })
                .catch(e => {
                    console.log("Error creating exercise:", e);
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

        updateTags: function(tags) {
            this.exerciseForm.tags = tags;
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
    .difficultyCard,
    .tagCard {
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
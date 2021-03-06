<template>
    <v-expansion-panel>
        <v-expansion-panel-header>{{ exerciseData.name }}</v-expansion-panel-header>
        <v-expansion-panel-content v-if="!isLoading">
            <v-sheet align="center">
                <v-container v-html="compiledMarkdown"></v-container>
            </v-sheet>
        </v-expansion-panel-content>
        <v-expansion-panel-content v-else><div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div></v-expansion-panel-content>
    </v-expansion-panel>
</template>

<script>
import { db } from '@/firebase'
import * as marked from 'marked'

export default {
    name: 'ExerciseExpandable',
    props: {
        exerciseToDownload: {
            type: Object,
            required: false
        },

        exercise: {
            type: Object,
            required: false
        }
    },
    data() {
        return {
            isLoading: true,
            exerciseData: {}
        }
    },

    mounted: function() {
        if (this.$props.exerciseToDownload) {
            this.exerciseData.name = this.$props.exerciseToDownload.name
            this.downloadExercise();
        } else if (this.$props.exercise) {
            this.exerciseData = this.$props.exercise;
            this.isLoading = false;
        }
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.exerciseData.description);
        }
    },

    methods: {
        downloadExercise: function() {
            db.collection("exercises").doc(this.$props.exerciseToDownload.id).get()
            .then(exerciseDoc => {
                this.exerciseData = exerciseDoc.data();
                this.isLoading = false;
            })
        }
    },

    watch: {
        exercise: function() {
            if (this.$props.exercise) {
                this.exerciseData = this.$props.exercise;
            } else if (!this.$props.exercise && !this.$props.exerciseToDownload) {
                this.exerciseData = {};
            }
        },

        exerciseToDownload: function() {
            if (this.$props.exerciseToDownload) {
                this.isLoading = true;
                this.exerciseData.name = this.$props.exerciseToDownload.name;
                this.downloadExercise();
            } else if (!this.$props.exerciseToDownload && !this.$props.exercise) {
                this.exerciseData = {};
            }
        }
    }
}
</script>
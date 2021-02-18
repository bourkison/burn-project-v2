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
import { db } from '../../firebase'
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
            db.collection("exercises").doc(this.$props.exerciseToDownload.id).get().then(exerciseDoc => {
                this.exerciseData = exerciseDoc.data();
                this.isLoading = false;
            })
        } else if (this.$props.exercise) {
            console.log("Exercise Expandable", this.$props.exercise);
            this.exerciseData = this.$props.exercise;
            this.isLoading = false;
        }
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.exerciseData.description);
        }
    }
}
</script>
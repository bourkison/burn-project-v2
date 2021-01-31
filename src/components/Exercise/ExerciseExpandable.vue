<template>
    <v-expansion-panel>
        <v-expansion-panel-header>{{ exercise.name }}</v-expansion-panel-header>
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
        exercise: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isLoading: true,
            exerciseData: {}
        }
    },

    created: function() {
        db.collection("exercises").doc(this.$props.exercise.id).get().then(exerciseDoc => {
            this.exerciseData = exerciseDoc.data();
            this.isLoading = false;
        })
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.exerciseData.description);
        }
    }
}
</script>
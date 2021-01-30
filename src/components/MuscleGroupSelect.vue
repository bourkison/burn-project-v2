<template>
    <v-card outlined class="muscleGroupsCont">
        <h2 align="center">Select Muscle Group(s)</h2>                
        <MuscleGroup v-bind:editable="true" v-bind:selectedGroups="selectedMuscleGroups" @mgClick="muscleGroupClickHandler"></MuscleGroup>

        <v-overflow-btn
            v-model="selectedMuscleGroups"
            :items="allMuscleGroups"
            label="Muscle Groups"
            multiple
            clear-icon
            outlined
            auto
            menu-props="{ top: true, offsetY: true }"
          >
            <template v-slot:selection="{ item, index }">
                <v-chip v-if="index < 3">
                    <span>{{ item }}</span>
                </v-chip>
                <span
                v-if="index === 3"
                class="grey--text caption"
                >
                (+{{ selectedMuscleGroups.length - 3 }} others)
                </span>
            </template>
        </v-overflow-btn>
    </v-card>
</template>

<script>
import MuscleGroup from './MuscleGroup.vue'
// import _ from 'lodash'

export default {
    name: "MuscleGroupSelect",
    components: { MuscleGroup },
    props: {
        selectedMgs: {
            type: Array,
            required: false
        }
    },
    data() { 
        return {
            selectedMuscleGroups: [],
            allMuscleGroups: ["Trapezius","Deltoids","Forearms","Lats","Abs","Obliques","Pectorals","Adductors","Calves","Hamstrings","Glutes","Quads","Triceps","Biceps"] 
        }
    },

    mounted: function() {
        if (this.$props.selectedMgs) {
            this.selectedMuscleGroups = this.$props.selectedMgs;
        }
    },

    methods: {
        muscleGroupClickHandler: function(id) {
            if (!this.selectedMuscleGroups.includes(id)) {
                this.selectedMuscleGroups.push(id);
                this.$emit("mgCH", this.selectedMuscleGroups);
            } else {
                let temp = [];
                this.selectedMuscleGroups.forEach(mg => {
                    if (mg != id) {
                        temp.push(mg);
                    }
                })

                this.selectedMuscleGroups = temp;
            }

            this.$emit("mgCH", this.selectedMuscleGroups);
        }
    }
}
</script>

<style scoped>
    .muscleGroupsCont {
        margin-top: 10px;
        padding-top:10px
    }
</style>
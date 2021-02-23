<template>
    <v-container class="setsAdder">
        <h2>Suggested Sets</h2>
        <v-row v-for="set in suggestedSets" :key="set.id" align="center" justify="center">
            <v-col cols="12" md="6" sm="12">
                <v-select :items="measureByOptions" v-model="set.measureBy"></v-select>
            </v-col>

            <v-col cols="12" md="5" sm="10">
                <v-text-field v-if="set.measureBy == 'Time'" label="Time (secs)" :rules=[rules.isNumber] v-model="set.measureAmount"></v-text-field>
                <v-text-field v-if="set.measureBy == 'Reps'" label="Reps"  :rules=[rules.isNumber] v-model="set.measureAmount"></v-text-field>
            </v-col>

            <v-col cols="12" md="1" sm="2" style="padding:0;">
                <v-icon @click="deleteSet(set.id)" color="error" small>mdi-close</v-icon>
            </v-col>
        </v-row>
        <v-btn @click="addSet">Add Set</v-btn>
    </v-container>
</template>

<script>
export default {
    name: 'SuggestedSetsSelector',
    props: {
        id: {
            required: false,
            type: String
        },
        initSuggestedSets: {
            required: false,
            type: Array
        }
    },
    data() {
        return {
            setIterator: 0,
            suggestedSets: [{id: 0, measureAmount: "0", measureBy: "Reps"}],

            // Vuetify:
            measureByOptions: ["Time", "Reps"],
            rules: {
                isNumber: value => !isNaN(value) || 'Must be a number'
            }
        }
    },

    mounted: function() {
        if (this.$props.initSuggestedSets) {
            console.log("INIT SUGGESTED");
            this.suggestedSets = this.$props.initSuggestedSets;
        }
    },

    methods: {
        addSet () {
            this.setIterator ++;
            const i = this.setIterator;
            this.suggestedSets.push({ id: i, measureBy: this.suggestedSets[this.suggestedSets.length - 1].measureBy, measureAmount: this.suggestedSets[this.suggestedSets.length - 1].measureAmount });
        },

        deleteSet (i) {
            if (this.suggestedSets.length > 1) {
                let index = this.suggestedSets.findIndex(x => x.id === i)
                this.suggestedSets.splice(index, 1);
            }
            document.activeElement.blur();
        },
    },

    watch: {
        suggestedSets: {
            handler: function() {
                this.$emit("updateSets", this.suggestedSets, this.$props.id);
            },
            deep: true
        }
    }
}
</script>
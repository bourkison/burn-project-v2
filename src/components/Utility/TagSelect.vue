<template>
    <v-container>
        <h2 align="center">Tags 
            <v-tooltip top offset-y>
                <template v-slot:activator="{ on, attrs }">
                    <v-icon small v-bind="attrs" v-on="on">mdi-help-circle-outline</v-icon>
                </template>
                <span>Add up to 5 tags so people can find your exercise easier.<br>Choose from the most popular tags, or add your own.</span>
            </v-tooltip>
        </h2>
        <v-combobox
            v-model="selected"
            :items="tagItems"
            label="Add tags"
            hint="Maximum of 5 tags"
            multiple
            small-chips
            persistent-hint
            :search-input.sync="searchText"
            clearable
            hide-selected
        >
            <template v-if="searchText" v-slot:no-data>
                <v-list-item>
                    <v-list-item-content>
                        <v-list-item-title>
                            No results matching "<strong>{{ searchText }}</strong>". Press <kbd>enter</kbd> to create one.
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </template>
        </v-combobox>
    </v-container>
</template>

<script>
export default {
    name: 'TagSelect',
    props: {
        initialTags: {
            type: Array,
            required: false
        }
    },

    data() {
        return {
            selected: [],
            tagItems: ["Cardio", "Strength", "No Equipment"],
            searchText: ''
        }
    },

    mounted: function() {
        if (this.$props.initialTags) {
            this.selected = this.$props.initialTags;
        }
    },

    watch: {
        selected: function(n) {
            if (n.length > 5) {
                this.$nextTick(() => this.selected.pop());
            }

            this.searchText = "";
            this.$emit("updateTags", this.selected);
        }
    }
}
</script>
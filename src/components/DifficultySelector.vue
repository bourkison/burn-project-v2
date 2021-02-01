<template>
    <v-card align="center" outlined>
        <h2>Difficulty</h2>
        <v-icon :color="stars[0].color" @click="starClick(0)" @mouseover="starHover(true, 0)" @mouseleave="starHover(false, 0)" x-large>{{ stars[0].icon }}</v-icon>
        <v-icon :color="stars[1].color" @click="starClick(1)" @mouseover="starHover(true, 1)" @mouseleave="starHover(false, 1)" x-large>{{ stars[1].icon }}</v-icon>
        <v-icon :color="stars[2].color" @click="starClick(2)" @mouseover="starHover(true, 2)" @mouseleave="starHover(false, 2)" x-large>{{ stars[2].icon }}</v-icon>
        <v-icon :color="stars[3].color" @click="starClick(3)" @mouseover="starHover(true, 3)" @mouseleave="starHover(false, 3)" x-large>{{ stars[3].icon }}</v-icon>
        <v-icon :color="stars[4].color" @click="starClick(4)" @mouseover="starHover(true, 4)" @mouseleave="starHover(false, 4)" x-large>{{ stars[4].icon }}</v-icon>
    </v-card>
</template>

<script>
export default {
    name: "DifficultySelector",
    props: {
        initialDifficulty: {
            type: Number,
            required: false
        }
    },

    data() {
        return {
            stars: [
                {color: "yellow darken-2", icon: "mdi-star", hover: false, clicked: true},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false},
                {color: "", icon: "mdi-star-outline", hover: false, clicked: false}
            ]
        }
    },

    created: function() {
        if (this.$props.initialDifficulty) {
            this.starClick(this.$props.initialDifficulty - 1);
        }
    },

    methods: {
        starHover (hover, star) {
            if (hover) {
                for (let i = 0; i <= star; i++) {
                    this.stars[i].icon = "mdi-star";
                }
            } else {
                for (let i = 0; i <= star; i ++) {
                    if (!this.stars[i].clicked) {
                        this.stars[i].icon = "mdi-star-outline";
                    }
                }
            }
        },

        starClick (star) {
            for (let i = 0; i <= star; i++) {
                this.stars[i].icon = "mdi-star";
                this.stars[i].color = "yellow darken-2"
                this.stars[i].clicked = true;
            }

            for (let i = star + 1; i < 5; i ++) {
                this.stars[i].icon = "mdi-star-outline";
                this.stars[i].color = "";
                this.stars[i].clicked = false;
            }

            document.activeElement.blur();
            this.$emit("setDifficulty", star + 1)
        }
    }
}
</script>
<template>
    <v-card outlined class="burnMin">
        <v-container>
            <v-row justify="center" align="center">
                <v-col cols="12" md="9">
                    <h2>{{ recentWorkout.name }}</h2>
                </v-col>
                <v-col cols="12" md="3" style="text-align: right;">
                    <em>{{ recentWorkout.createdAtText }}</em>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
export default {
    name: 'BurnMin',
    props: {
        recentWorkout: {
            type: Object,
            required: true
        }
    },

    created: function() {
        console.log(this.$props.recentWorkout);
    }
}
</script>

<style scoped>
    .burnMin {
        margin-bottom: 15px;
    }
</style>
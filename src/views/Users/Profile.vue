<template>
    <v-container class="mainCont" fluid>
        <v-row>
            <v-spacer/>
            <v-col cols="12" sm="3" xl="2">
                <v-card>
                    <v-sheet rounded="lg" min-height="268"></v-sheet>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" lg="5" xl="4">
                <router-view></router-view>
            </v-col>
            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268"></v-sheet>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'Profile'
}
</script>
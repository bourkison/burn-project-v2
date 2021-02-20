<template>
    <v-container class="mainCont" fluid>
        <v-row>
            <v-spacer></v-spacer>
            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268">
                <!--  -->
                </v-sheet>
            </v-col>

            <v-col cols="12" sm="6" lg="5" xl="4">
                <v-sheet min-height="70vh" rounded="lg">
                    <v-container v-if="$store.state.userProfile.loggedIn">
                        <Feed></Feed>
                    </v-container>
                    <v-container v-else>
                        <router-link to="/login">Login</router-link> or <router-link to="/signup">Sign Up</router-link> to get started.
                    </v-container>
                </v-sheet>
            </v-col>

            <v-col cols="12" sm="3" xl="2">
                <v-sheet rounded="lg" min-height="268">
                <!--  -->
                </v-sheet>
            </v-col>
            <v-spacer></v-spacer>
        </v-row>
    </v-container>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import Feed from '@/components/Posts/Feed.vue'

export default {
    name: 'Home',
    components: { Feed },
    data() {
        return {
            // isLoading: false
        }
    },
}
</script>

<style scoped>
    .mainCont {
        width: 100%;
        max-width: 1400px !important;
    }
</style>
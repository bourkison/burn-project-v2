<template>
    <v-container>
        <v-row>
        <v-spacer></v-spacer>
        <v-col cols="12" sm="2">
            <v-sheet rounded="lg" min-height="268">
            <!--  -->
            </v-sheet>
        </v-col>

        <v-col cols="12" sm="6">
            <v-sheet min-height="70vh" rounded="lg">
            <v-container v-if="$store.state.userProfile.loggedIn">
                <div v-if="!isLoading">
                    Welcome {{ $store.state.userProfile.docData.username }}
                </div>
                <div v-else>
                    <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                </div>
            </v-container>
            <v-container v-else>
                <router-link to="/login">Login</router-link> or <router-link to="/signup">Sign Up</router-link> to get started.
            </v-container>
            </v-sheet>
        </v-col>

        <v-col cols="12" sm="2">
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
import { functions } from '@/firebase'

export default {
    name: 'Home',
    components: { },
    data() {
        return {
            isLoading: true
        }
    },

    created: function() {
        let buildFeedFunction = functions.httpsCallable("buildFeed");

        buildFeedFunction().then(result => {
            console.log("Success:", result);
            this.isLoading = false;
        }).catch(e => {
            console.error("Failure", e);
            this.isLoading = false;
        })
    }
}
</script>

<style scoped>  
</style>
<template>
  <v-app id="inspire">
    <div v-if="$store.state.userProfile != null">
      <v-app-bar
        app
        flat
      >
        <v-avatar
          size="32"
        ></v-avatar>
        <v-tabs centered class="ml-n9">
          <v-tab key="homeTab" to="/">Home</v-tab>
          <v-tab v-if="$store.state.userProfile.loggedIn" to="/exercises">Exercises</v-tab>
          <v-tab v-if="$store.state.userProfile.loggedIn" @click="signOut()">Sign Out</v-tab>
          <v-tab v-if="!$store.state.userProfile.loggedIn" to="/login">Login</v-tab>
          <v-tab v-if="!$store.state.userProfile.loggedIn" to="/signup">Sign Up</v-tab>
        </v-tabs>
        <v-avatar
          class="hidden-sm-and-down"
          size="32"
        ></v-avatar>
      </v-app-bar>

      <v-main class="lighten-3">
          <router-view></router-view>
      </v-main>
    </div>
    <div v-else>
      <v-app-bar app flat>
      </v-app-bar>
      <v-main class="lighten-3">
        <v-container>
          <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
      </v-main>
    </div>
  </v-app>
</template>

<script>
import { auth } from './firebase'
export default {
  data() {
    return {
    }
  },

  methods: {
    signOut: function() {
      auth.signOut()
    }
  }
}
</script>
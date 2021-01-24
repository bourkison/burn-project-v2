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
          <div v-if="$store.state.userProfile.loggedIn"><h1>Welcome {{ $store.state.userProfile.docData.firstName }}</h1></div>
          <div v-else>
            <router-link to="/login">Login</router-link> or <router-link to="/signup">Sign Up</router-link> to get started.
          </div>
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

export default {
  name: 'Home',
  components: { }
}
</script>

<style scoped>  
</style>
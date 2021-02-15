<template>
    <div>{{ $route.params.profileid }}</div>
</template>

<script>
import { db } from '../../firebase'

export default {
    name: 'Profile',
    data() {
        return {
            isLoading: true,
            profileData: {}
        }
    },

    created: function() {
        if (this.$route.params.profileid === this.$store.state.userProfile.docData.username) {
            console.log("My profile");
            this.isLoading = false;
            this.profileData = this.$store.state.userProfile.docData;
        } else {
            console.log(this.$route.params.profileid);
            db.collection("users").where("username", "==", this.$route.params.profileid).get().then(querySnapshot => {
                if (querySnapshot.size > 0) {
                    querySnapshot.forEach(user => {
                        this.profileData = user.data();
                        this.isLoading = false;
                        console.log(this.profileData);
                    })
                } else {
                    // TODO: DISPLAY 404 NOT FOUND HERE.
                    console.log (404);
                }
            })
        }
    }
}
</script>
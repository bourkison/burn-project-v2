<template>
    <div></div>
</template>

<script>
import { db } from '../../firebase'

export default {
    name: "UserProfile",
    data() {
        return {
            isLoading: true,
            userId: '',
            user: {},
            userExercises: []
        }
    },

    created: function() {
        this.user = this.$store.state.userProfile.docData;
        this.userId = this.$store.state.userProfile.data.uid;

        db.collection("exercises").where("createdBy", "==", this.userId).orderBy("createdAt").get().then(exerciseSnapshot => {
            exerciseSnapshot.forEach(exerciseDoc => {
                this.userExercises.push(exerciseDoc.data());
            })

            console.log(this.userExercises);
        })
    }
}
</script>

<style scoped>

</style>
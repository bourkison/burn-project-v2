<template>
    <div>New Workout</div>
</template>

<script>
import { db } from '../../firebase'

export default {
    name: 'NewWorkout',
    data() {
        return {
            isLoading: true,
            errorMessage: '',
            userCreatedExercises: [],
            userFollowedExercises: []
        }
    },

    created: function() {
        // Download user exercises.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("exercises").orderBy("createdAt", "desc").get().then(exercisesSnapshot => {
            if (exercisesSnapshot.size > 0) {
                exercisesSnapshot.forEach(exercise => {
                    if (exercise.data().isFollow) {
                        this.userFollowedExercises.push(exercise.id);
                    } else {
                        this.userCreatedExercises.push(exercise.id);
                    }

                    console.log("Created", this.userCreatedExercises);
                    console.log("Followed", this.userFollowedExercises);
                    this.isLoading = false;
                })
            }
        }).catch(e => {
            this.isLoading = false;
            this.errorMessage = "Error downloading exercises " + e;
            console.log(this.errorMessage);
        })
    }
}
</script>
<script>
export default {
  mounted() {
    console.log(this.$auth.loggedIn, this.$auth.user);
  },
  methods: {
    logout() {
      this.$auth.logout();
    },
  },
};
</script>

<template>
  <div class="index">
    <h1>Logged in</h1>
    <br />
    <button @click="logout">Logout</button>
  </div>
</template>

<style>
.index {
  padding: 2rem;
}
</style>

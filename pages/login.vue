<script>
export default {
  auth: false,
  data() {
    return {
      email: '',
      password: '',
    };
  },
  methods: {
    async loginGoogle() {
      console.log(await this.$auth.login('google'));
    },
    async loginPassword() {
      console.log(
        await this.$auth.login('password', {
          email: this.email,
          password: this.password,
        })
      );
      this.email = '';
      this.password = '';
    },
    logout() {
      this.$auth.logout();
    },
  },
};
</script>

<template>
  <div class="login">
    <h1>Login</h1>
    <br />
    <button><nuxt-link to="/login-ui">Login UI</nuxt-link></button>
    <br />
    <br />
    <button @click="loginGoogle">Login Google</button>
    <br />
    <br />
    <input v-model="email" type="email" placeholder="email" />
    <input v-model="password" type="password" placeholder="password" />
    <button @click="loginPassword">Login Password</button>
  </div>
</template>

<style>
.login {
  padding: 2rem;
}
</style>

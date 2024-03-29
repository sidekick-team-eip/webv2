import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      id: "signin",
      name: "Signin",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const { email, password } = credentials as { email: string, password: string };

        console.log(email, password);
        console.log(process.env.NEXT_PUBLIC_API_URL + "/auth/login");
        try {
          const login = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!login.ok) {
            throw new Error("Unable to login");
          }

          const tokens = await login.json();

          const userInfos = await fetch(process.env.NEXT_PUBLIC_API_URL + "/user_infos/", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
            }
          });

          if (!userInfos.ok) {
            throw new Error("Unable to get user infos");
          }

          const user = await userInfos.json();

          let admin = false;
          const admin_req = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/admin", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
            }
          });

          if (admin_req.ok)
            admin = true;

          return {
            id: user.userId,
            username: user.username,
            email: user.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            sidekick: user.sidekick_id,
            admin,
          }
        } catch (e) {
          console.log(e);
          return null
        }
      }
    }),
    CredentialsProvider({
      id: "signup",
      name: "Signup",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        gender: { label: "Gender", type: "text" },
        birth_date: { label: "Birth date", type: "text" },
        description: { label: "Description", type: "text" },
        firstname: { label: "Firstname", type: "text" },
        lastname: { label: "Lastname", type: "text" },
        weight: { label: "Weight", type: "text" },
        goal_weight: { label: "Weight", type: "text" },
        level: {label: "Level", type: "text"},
        location: {label: "Level", type: "text"},
        size: { label: "size", type: "text" },
        goal: { label: "Goal", type: "text" },
        activities: { label: "Activities", type: "array" },
      },
      async authorize(credentials, req) {
        const { email, password, gender, birth_date, description, firstname, lastname, weight, size, goal, activities, goal_weight, level, location } = credentials as {
          email: string,
          password: string,
          username: string,
          gender: string,
          birth_date: string,
          description: string,
          firstname: string,
          lastname: string,
          weight: string,
          size: string,
          goal: string,
          activities: string,
          goal_weight: string,
          level: string,
          location: string,
        };
        console.log(credentials);
        try {
          const register = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!register.ok) {
            throw new Error("Unable to login");
          }

          const tokens = await register.json();

          const setUserInfos = await fetch(process.env.NEXT_PUBLIC_API_URL + "/user_infos/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${tokens.access_token}`,
            },
            body: JSON.stringify({
              gender,
              birth_date: new Date(birth_date).toISOString(),
              description,
              firstname,
              lastname,
              weight: parseInt(weight),
              size: parseInt(size),
              goal,
              activities: [activities],
              goal_weight: parseInt(goal_weight),
              level,
              location
            }),
          });

          if (!setUserInfos.ok) {
            throw new Error("Unable to set user infos");
          }

          const userInfos = await fetch(process.env.NEXT_PUBLIC_API_URL + "/user_infos/", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
            }
          });

          if (!userInfos.ok) {
            throw new Error("Unable to get user infos");
          }

          let admin = false;
          const admin_req = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/admin", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
            }
          });

          if (admin_req.ok)
            admin = true;

          const user = await userInfos.json();

          return {
            id: user.userId,
            username: user.username,
            email: user.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            sidekick: user.sidekick_id,
            admin
          }
        } catch (e) {
          console.log(e);
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user
      }

      if (token?.exp && Date.now() >= (token.exp as number) * 1000 + 1000) {
        const refresh = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: token.refresh_token }),
        });

        if (!refresh.ok) {
          throw new Error("Unable to refresh token");
        }

        const tokens = await refresh.json();

        token.access_token = tokens.access_token;
        token.refresh_token = tokens.refresh_token;
        token.exp = Date.now() / 1000 + 60 * 60;
      }

      return token
    },

    async session({ session, token }: any): Promise<any> {
      session.user = token.user
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60,
  },
}

export default NextAuth(authOptions);
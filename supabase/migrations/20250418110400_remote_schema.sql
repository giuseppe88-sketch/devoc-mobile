

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert into public.users table, taking role from the metadata passed during signup
  INSERT INTO public.users (id, email, role)
  VALUES (
    new.id,
    new.email,
    -- Use the 'role' value from the user_metadata if available, otherwise default to 'client'
    COALESCE(new.raw_user_meta_data->>'role', 'client')::text -- Ensure it's cast to text
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_client"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'client'
  );
$$;


ALTER FUNCTION "public"."is_client"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_developer"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'developer'
  );
$$;


ALTER FUNCTION "public"."is_developer"("user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "developer_id" "uuid",
    "client_id" "uuid",
    "start_time" timestamp without time zone NOT NULL,
    "end_time" timestamp without time zone NOT NULL,
    "status" "text" NOT NULL,
    "calendar_event_id" "text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."developer_profiles" (
    "id" "uuid" NOT NULL,
    "phone_number" "text",
    "skills" "text"[],
    "focus_areas" "text"[],
    "portfolio_url" "text",
    "github_url" "text",
    "hourly_rate" numeric,
    "location" "text",
    "years_of_experience" integer,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."developer_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid",
    "reviewer_id" "uuid",
    "rating" integer,
    "comment" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "full_name" "text",
    "email" "text",
    "avatar_url" "text",
    "bio" "text",
    "timezone" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['developer'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."developer_profiles"
    ADD CONSTRAINT "developer_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."developer_profiles"
    ADD CONSTRAINT "developer_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow public read access to users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Clients can cancel their bookings" ON "public"."bookings" FOR UPDATE USING ((("auth"."uid"() = "client_id") AND ("status" = 'confirmed'::"text"))) WITH CHECK (("status" = 'cancelled'::"text"));



CREATE POLICY "Clients can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "client_id"));



CREATE POLICY "Clients can view their bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "client_id"));



CREATE POLICY "Developers can update booking status" ON "public"."bookings" FOR UPDATE USING ((("auth"."uid"() = "developer_id") AND (("status" = 'pending'::"text") OR ("status" = 'confirmed'::"text")))) WITH CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text"])));



CREATE POLICY "Developers can view their bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "developer_id"));



CREATE POLICY "Only clients can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK ((("auth"."uid"() IN ( SELECT "bookings"."client_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "reviews"."booking_id"))) AND (EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE (("bookings"."id" = "reviews"."booking_id") AND ("bookings"."status" = 'confirmed'::"text"))))));



CREATE POLICY "Reviews visible to involved parties" ON "public"."reviews" FOR SELECT USING (("auth"."uid"() IN ( SELECT "bookings"."client_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "reviews"."booking_id")
UNION
 SELECT "bookings"."developer_id"
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "reviews"."booking_id"))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_client"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_client"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_client"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_developer"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_developer"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_developer"("user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."developer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."developer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."developer_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

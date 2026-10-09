import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { z } from "zod";
import { Redirect, router, useIsFocused } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Screen,
  Copy,
  Field,
  Button,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import { Avatar, ProfileHeader } from "../src/ui/profile-components";
import {
  GenderPicker,
  PicturePicker,
} from "../src/features/profile/profile-selectors";
import { ProvincePicker } from "../src/features/profile/province-picker";
import { BirthdayPicker } from "../src/features/profile/birthday-picker";
import { birthdateInputSchema, displayBirthdate } from "../src/auth/calendar";
import { profileSchema } from "../src/auth/schemas";
import { getProfile, updateProfile, errorKey } from "../src/auth/service";
import { useSession } from "../src/auth/session";
import { useI18n } from "../src/i18n";
import { usePalette } from "../src/ui/theme";
export default function EditProfile() {
  const { t, language } = useI18n();
  const c = usePalette();
  const fieldRow = {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingVertical: 4,
  };
  const focused = useIsFocused();
  const user = useSession((s) => s.user);
  const status = useSession((s) => s.status);
  const setUser = useSession((s) => s.setUser);
  const cache = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const schema = useMemo(
    () =>
      profileSchema
        .omit({ username: true, email: true, bio: true, profile_link: true })
        .extend({
          birthdate: birthdateInputSchema(language).or(z.literal("")),
        }),
    [language],
  );
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: ({ signal }) => getProfile(signal),
    enabled: status === "authenticated",
    retry: false,
  });
  const { control, handleSubmit, reset, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      province: "",
      avatar: "",
      birthdate: "",
      gender: "prefer_not_to_say" as const,
    },
  });
  useEffect(() => {
    if (profile.data)
      reset({
        name: profile.data.name ?? "",
        province: profile.data.province ?? "",
        avatar: profile.data.avatar ?? "",
        birthdate: displayBirthdate(profile.data.birthdate, language),
        gender: profile.data.gender ?? "prefer_not_to_say",
      });
  }, [profile.data, reset, language]);
  const avatar = useWatch({ control, name: "avatar" });
  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (value) => {
      if (useSession.getState().user?.id !== value.id) return;
      setUser(value);
      cache.setQueryData(["profile", value.id], value);
      router.replace("/profile");
    },
  });
  const submit = handleSubmit((values) => {
    if (!values.birthdate && profile.data?.birthdate) {
      setError("birthdate", { message: "تاریخ تولد را وارد کنید." });
      return;
    }
    save.mutate({
      name: values.name || null,
      province: values.province || null,
      avatar: values.avatar || null,
      gender: values.gender,
      ...(values.birthdate ? { birthdate: values.birthdate } : {}),
    });
  });
  if (status === "guest" && focused) return <Redirect href="/login" />;
  if (status !== "authenticated" || profile.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (profile.isError)
    return (
      <Screen>
        <ErrorState
          flat
          retry={() => {
            void profile.refetch();
          }}
        />
        <Button
          label={t("بازگشت")}
          secondary
          plain
          onPress={() => router.replace("/profile")}
        />
      </Screen>
    );
  const nameInput = (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <Field
          plain
          inline
          label={t("نام")}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          editable={!save.isPending}
          maxLength={100}
        />
      )}
    />
  );
  return (
    <Screen
      headerDivider={false}
      header={
        <ProfileHeader
          title="ویرایش پروفایل"
          action={
            <Button
              label={t("ذخیره")}
              plain
              loading={save.isPending}
              disabled={uploading}
              onPress={() => {
                void submit();
              }}
            />
          }
        />
      }
    >
      <View style={{ alignItems: "center", gap: 12 }}>
        <Avatar uri={avatar} size={80} />
        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <PicturePicker
              onChange={field.onChange}
              disabled={save.isPending}
              onBusy={setUploading}
            />
          )}
        />
      </View>
      <Copy variant="small">{t("اطلاعات نمایه")}</Copy>
      <View style={fieldRow}>{nameInput}</View>
      <Copy variant="small">{t("اطلاعات خصوصی")}</Copy>
      <View>
        <View style={fieldRow}>
          <Controller
            control={control}
            name="province"
            render={({ field, fieldState }) => (
              <View>
                <ProvincePicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={save.isPending}
                />
                {fieldState.error && (
                  <Copy accessibilityRole="alert" style={{ color: c.danger }}>
                    {t(fieldState.error.message ?? "")}
                  </Copy>
                )}
              </View>
            )}
          />
        </View>
        <View style={fieldRow}>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <GenderPicker
                value={field.value}
                onChange={field.onChange}
                disabled={save.isPending}
              />
            )}
          />
        </View>
        <Controller
          control={control}
          name="birthdate"
          render={({ field, fieldState }) => (
            <View style={fieldRow}>
              <BirthdayPicker
                value={field.value}
                onChange={field.onChange}
                disabled={save.isPending}
              />
              {fieldState.error && (
                <Copy accessibilityRole="alert" style={{ color: c.danger }}>
                  {t(fieldState.error.message ?? "")}
                </Copy>
              )}
            </View>
          )}
        />
      </View>
      {save.isError && (
        <Copy accessibilityRole="alert" style={{ color: c.danger }}>
          {t(errorKey(save.error))}
        </Copy>
      )}
    </Screen>
  );
}

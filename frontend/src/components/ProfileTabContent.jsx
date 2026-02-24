import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlinePencilSquare, HiOutlineUserCircle } from "react-icons/hi2";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/authService";
import { API_BASE_URL } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import "./ProfileTabContent.css";

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  phone: "",
  avatar: "",
};

const USERNAME_REGEX = /^[\w.@+-]+$/;

function resolveImageUrl(path) {
  if (!path) {
    return "";
  }
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }
  const apiOrigin = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin;
  return new URL(String(path).replace(/\\/g, "/"), `${apiOrigin}/`).toString();
}

function toProfileForm(payload = {}) {
  return {
    name: payload.name || "",
    username: payload.username || "",
    email: payload.email || "",
    phone: payload.phone || "",
    avatar: payload.avatar || "",
  };
}

function getFieldErrors(error) {
  const payload = error?.response?.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const fields = ["name", "username", "email", "phone", "avatar"];
  const errors = {};
  for (const field of fields) {
    const value = payload[field];
    if (Array.isArray(value) && value.length) {
      errors[field] = String(value[0]);
    } else if (typeof value === "string" && value.trim()) {
      errors[field] = value;
    }
  }
  return errors;
}

function firstApiError(error, fallback) {
  const payload = error?.response?.data;
  if (!payload) {
    return fallback;
  }
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (typeof payload?.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }
  if (Array.isArray(payload?.non_field_errors) && payload.non_field_errors.length) {
    return String(payload.non_field_errors[0]);
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length) {
      return String(value[0]);
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
}

function getNormalizedValues(values) {
  return {
    name: String(values?.name || "").trim(),
    username: String(values?.username || "").trim(),
    email: String(values?.email || "").trim(),
    phone: String(values?.phone || "").trim(),
  };
}

export default function ProfileTabContent() {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const localAvatarObjectUrlRef = useRef("");

  const clearLocalAvatarObjectUrl = () => {
    if (localAvatarObjectUrlRef.current) {
      URL.revokeObjectURL(localAvatarObjectUrlRef.current);
      localAvatarObjectUrlRef.current = "";
    }
  };

  const resetForReadonly = (nextForm) => {
    clearLocalAvatarObjectUrl();
    setAvatarFile(null);
    setAvatarPreview(resolveImageUrl(nextForm.avatar));
    setAvatarInputKey((prev) => prev + 1);
    setFieldErrors({});
    setIsEditing(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await authService.getProfile();
        const nextForm = toProfileForm(response.data);
        setInitialForm(nextForm);
        setForm(nextForm);
        resetForReadonly(nextForm);
      } catch {
        addToast({ type: "error", message: "Unable to load profile." });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      clearLocalAvatarObjectUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToast]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleEdit = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(initialForm);
    resetForReadonly(initialForm);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    if (fieldErrors.avatar) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });
    }

    clearLocalAvatarObjectUrl();
    if (!file) {
      setAvatarPreview(resolveImageUrl(form.avatar));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    localAvatarObjectUrlRef.current = previewUrl;
    setAvatarPreview(previewUrl);
  };

  const hasChanges = () => {
    const current = getNormalizedValues(form);
    const baseline = getNormalizedValues(initialForm);
    return (
      current.name !== baseline.name ||
      current.username !== baseline.username ||
      current.email !== baseline.email ||
      current.phone !== baseline.phone ||
      Boolean(avatarFile)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEditing || saving) {
      return;
    }

    const trimmedUsername = form.username.trim();
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      const message = "Username can only contain letters, numbers, and @/./+/-/_ characters.";
      setFieldErrors((prev) => ({ ...prev, username: message }));
      addToast({ type: "error", message });
      return;
    }

    if (!hasChanges()) {
      addToast({ type: "info", message: "No changes to save." });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("username", trimmedUsername);
      payload.append("email", form.email.trim());
      payload.append("phone", form.phone.trim());
      if (avatarFile) {
        payload.append("avatar", avatarFile);
      }

      const response = await authService.updateProfile(payload);
      const nextForm = toProfileForm(response?.data || form);
      setInitialForm(nextForm);
      setForm(nextForm);
      resetForReadonly(nextForm);
      await refreshProfile();
      addToast({ type: "success", message: "Profile updated." });
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      addToast({ type: "error", message: firstApiError(error, "Unable to save profile.") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="profile-tab-shell">
      <form className="panel-card stack-form profile-tab-form" onSubmit={handleSubmit}>
        <div className="profile-avatar-toolbar">
          <div className="profile-avatar-left"></div>

          <div className="profile-avatar-center">
            <div className="profile-avatar-preview">
              {avatarPreview ? <img src={avatarPreview} alt="Profile avatar" /> : <HiOutlineUserCircle />}
            </div>
            <p className="profile-avatar-label">Profile Icon</p>
          </div>

          <div className="profile-avatar-right">
            {!isEditing ? (
              <button
                type="button"
                className="btn btn-primary btn-icon profile-edit-btn"
                onClick={handleEdit}
                disabled={saving}
              >
                <HiOutlinePencilSquare />
                Edit Profile
              </button>
            ) : null}
            {isEditing ? (
              <>
                <input
                  key={avatarInputKey}
                  id="avatar"
                  className="profile-avatar-input-hidden"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  disabled={saving}
                  onChange={handleAvatarChange}
                />
                <label
                  htmlFor="avatar"
                  className={`btn btn-muted profile-change-icon-btn ${saving ? "is-disabled" : ""}`.trim()}
                >
                  Change Icon
                </label>
                {avatarFile ? <p className="profile-file-note">{avatarFile.name}</p> : null}
                {fieldErrors.avatar ? <p className="form-error-text">{fieldErrors.avatar}</p> : null}
              </>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            disabled={!isEditing || saving}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            required
          />
          {fieldErrors.name ? <p className="form-error-text">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={form.username}
            disabled={!isEditing || saving}
            onChange={(event) => handleFieldChange("username", event.target.value)}
            required
          />
          {fieldErrors.username ? <p className="form-error-text">{fieldErrors.username}</p> : null}
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            disabled={!isEditing || saving}
            onChange={(event) => handleFieldChange("email", event.target.value)}
            required
          />
          {fieldErrors.email ? <p className="form-error-text">{fieldErrors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            value={form.phone}
            disabled={!isEditing || saving}
            onChange={(event) => handleFieldChange("phone", event.target.value)}
            required
          />
          {fieldErrors.phone ? <p className="form-error-text">{fieldErrors.phone}</p> : null}
        </div>

        {isEditing ? (
          <div className="profile-save-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn btn-muted" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        ) : null}
      </form>

      {user?.is_email_verified ? null : (
        <div className="inline-controls profile-verify-row">
          <p className="empty-state">Email not verified.</p>
          <Link to={`/verify-email?email=${encodeURIComponent(user?.email || "")}`} className="btn btn-muted">
            Verify Email
          </Link>
        </div>
      )}
    </section>
  );
}

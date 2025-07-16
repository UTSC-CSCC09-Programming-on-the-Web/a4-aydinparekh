let apiService = (function () {
  let module = {};
  /** Function Documentation created with Github Copilot with prompt:
   * Create function documentation for these functions.
   */

  /**
   * Gets a paginated list of users.
   * @param {number} [page=0] - The page number (used as offset).
   * @returns {Promise<Array>} Array of user objects.
   */
  module.getPaginatedUsers = function (page = 0) {
    return fetch(`/api/users?page=${page}`).then((res) => {
      if (!res.ok) return [];
      return res.json();
    });
  };

  /**
   * Gets the total number of users.
   * @returns {Promise<number>} The total user count.
   */
  module.getUserCount = function () {
    return fetch("/api/users/count").then((res) => {
      if (!res.ok) return 0;
      return res.json().then((data) => data.count);
    });
  };

  /**
   * Adds a new image to the gallery.
   * @param {string} title - The title of the image.
   * @param {File} file - The image file.
   * @returns {Promise<Object>} The added image object.
   */
  module.addImage = function (title, file) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", file);

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated");
    }

    return fetch("/api/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to add image");
      return res.json();
    });
  };

  /**
   * Gets a paginated image from the gallery for a specific user.
   * @param {number} userId - The ID of the user whose images to retrieve.
   * @param {number} [page=0] - The page number (used as offset).
   * @returns {Promise<Object>} The image object for the given page.
   */
  module.getPaginatedUserGalleryImage = function (userId, page = 0) {
    return fetch(`/api/users/${userId}/images?page=${page}`).then((res) => {
      if (!res.ok) return [];
      return res.json();
    });
  };

  /**
   * Gets the image at the specified imageId.
   * @param {number} imageId - The ID of the image to retrieve.
   * @returns {Promise<Object>} The image object.
   */
  module.getImage = function (imageId) {
    return fetch(`/api/images/${imageId}`).then((res) => {
      if (!res.ok) {
        throw new Error(`Image with ID ${imageId} not found`);
      }
      return res.json();
    });
  };

  /**
   * Deletes an image from the gallery given its imageId.
   * @param {string} imageId - The ID of the image to delete.
   * @returns {Promise<Object>} The result of the delete operation.
   */
  module.deleteImage = function (imageId) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated");
    }
    return fetch(`/api/images/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to delete image with ID ${imageId}`);
      }
      return res.json();
    });
  };

  /**
   * Gets the total number of images in a user's gallery.
   * @returns {Promise<number>} The total image count.
   */
  module.getImageCount = function (userId) {
    return fetch(`/api/users/${userId}/images/count`).then((res) => {
      if (!res.ok) return 0;
      return res.json().then((data) => data.count);
    });
  };

  /**
   * Adds a comment to an image.
   * @param {string} imageId - The ID of the image to comment on.
   * @param {string} author - The author of the comment.
   * @param {string} content - The content of the comment.
   * @returns {Promise<Object>} The added comment object.
   */
  module.addComment = function (imageId, content) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated");
    }
    return fetch(`/api/images/${imageId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    });
  };

  /**
   * Deletes a comment from an image.
   * @param {string} imageId - The ID of the image.
   * @param {string} commentId - The ID of the comment to delete.
   * @returns {Promise<Object>} The result of the delete operation.
   */
  module.deleteComment = function (imageId, commentId) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated");
    }
    return fetch(`/api/images/${imageId}/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok)
        throw new Error(`Failed to delete comment with ID ${commentId}`);
      return res.json();
    });
  };

  /**
   * Gets the latest comments for an image, paginated.
   * @param {string} imageId - The ID of the image.
   * @param {number} [page=0] - The page number.
   * @param {number} [limit=10] - The number of comments per page.
   * @returns {Promise<Array>} Array of comment objects.
   */
  module.getComments = function (imageId, page = 0, limit = 10) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated");
    }
    return fetch(
      `/api/images/${imageId}/comments?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch comments");
        return res.json();
      })
      .then((data) => data.comments);
  };

  /**
   * Gets the total number of comments for an image.
   * @param {string} imageId - The ID of the image.
   * @returns {Promise<number>} The total comment count.
   */
  module.getCommentCount = function (imageId) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("User not authenticated");
    }
    return fetch(`/api/images/${imageId}/comments/count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch comment count");
        return res.json();
      })
      .then((data) => data.count);
  };

  // User authentication methods
  /**
   * Registers a new user.
   * @param {string} username - The username of the new user.
   * @param {string} password - The password of the new user.
   * @returns {Promise<Object>} The registered user object.
   */
  module.registerUser = function (username, password) {
    return fetch("/api/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to register user");
      // Add the token to localStorage
      return res.json().then((data) => {
        localStorage.setItem("token", data.token);
        return data.user;
      });
    });
  };

  /**
   * Logs in a user.
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {Promise<Object>} The logged-in user object.
   */
  module.loginUser = function (username, password) {
    return fetch("/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to log in user");
      // Add the token to localStorage
      return res.json().then((data) => {
        localStorage.setItem("token", data.token);
        return data.user;
      });
    });
  };

  /**
   * Get the currently logged-in user.
   * @returns {Promise<Object>} The user object if logged in, otherwise null.
   */
  module.getCurrentUser = function () {
    const token = localStorage.getItem("token");
    if (!token) {
      return Promise.resolve(null); // No user logged in
    }
    return fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) return Promise.resolve(null);
      return res.json();
    });
  };

  /**
   * Logs out the current user.
   * @returns {Promise<void>} Resolves when logout is successful.
   */
  module.logoutUser = function () {
    const token = localStorage.getItem("token");
    localStorage.removeItem("token");
    if (!token) return Promise.resolve();
    return fetch("/api/users/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) {
        throw new Error("Failed to log out user");
      }
      return res.json();
    });
  };

  return module;
})();

window.apiService = apiService;

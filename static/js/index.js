/* global meact, apiService */

(function () {
  ("use strict");

  const [image, getImage, setImage] = meact.useState();
  const [imageCount, getImageCount, setImageCount] = meact.useState(null);
  const [imageOffset, getImageOffset, setImageOffset] = meact.useState(0);
  const [userOffset, getUserOffset, setUserOffset] = meact.useState(0);
  const [, getUserCount, setUserCount] = meact.useState(0);
  const [curUserGallery, getCurUserGallery, setCurUserGallery] =
    meact.useState(null);
  const [comments, getComments, setComments] = meact.useState([]);
  const [commentCount, getCommentCount, setCommentCount] = meact.useState(0);
  const [commentPage, getCommentPage, setCommentPage] = meact.useState(0);
  const [imageLoading, getImageLoading, setImageLoading] = meact.useState(true);
  const [commentsLoading, getCommentsLoading, setCommentsLoading] =
    meact.useState(true);
  const [isAuthed, getIsAuthed, setIsAuthed] = meact.useState(false);
  const [username, getUsername, setUsername] = meact.useState("");
  const [userGalleryLoading, getUserGalleryLoading, setUserGalleryLoading] =
    meact.useState(true);

  function updateAuthUI(isAuthedUser) {
    // Left panel
    const authForm = document.querySelector(".auth-form");
    const logoutBtn = document.querySelector("#logout-button");
    // Right panel
    const addCommentForm = document.querySelector(".add-comment-form");
    // Comments section
    const commentSection = document.querySelector(".right-panel");

    if (isAuthedUser) {
      if (authForm) authForm.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.remove("hidden");
      if (addCommentForm) addCommentForm.classList.remove("hidden");
      if (commentSection) commentSection.classList.remove("hidden");
    } else {
      if (authForm) authForm.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
      if (addCommentForm) addCommentForm.classList.add("hidden");
      if (commentSection) commentSection.classList.add("hidden");
    }
  }

  // Function to set Current User
  function renderUserTitle(username) {
    const currentUserContainer = document.querySelector(".current-user");
    if (currentUserContainer) {
      currentUserContainer.textContent = username
        ? `Current User: ${username}`
        : "";
    }
  }

  // Function to Set Image Error State
  function setImageError(msg) {
    const imageErrorContainer = document.querySelector("#image-error-box");
    if (imageErrorContainer) {
      imageErrorContainer.textContent = msg || "";
      if (msg) {
        imageErrorContainer.classList.remove("hidden");
      } else {
        imageErrorContainer.classList.add("hidden");
      }
    }
  }

  // Function to Set Comment Error State
  function setCommentError(msg) {
    const commentErrorContainer = document.querySelector("#comment-error-box");
    if (commentErrorContainer) {
      commentErrorContainer.textContent = msg || "";
      if (msg) {
        commentErrorContainer.classList.remove("hidden");
      } else {
        commentErrorContainer.classList.add("hidden");
      }
    }
  }

  // Function to set Auth Error State
  function setAuthError(msg) {
    const authErrorContainer = document.querySelector("#auth-error-box");
    if (authErrorContainer) {
      authErrorContainer.textContent = msg || "";
      if (msg) {
        authErrorContainer.classList.remove("hidden");
      } else {
        authErrorContainer.classList.add("hidden");
      }
    }
  }

  // Function to set User Gallery Error State
  function setUserGalleryError(msg) {
    const userErrorContainer = document.querySelector("#user-error-box");
    if (userErrorContainer) {
      userErrorContainer.textContent = msg || "";
      if (msg) {
        userErrorContainer.classList.remove("hidden");
      } else {
        userErrorContainer.classList.add("hidden");
      }
    }
  }

  function ImageComponent(image) {
    const elmt = document.createElement("div");
    elmt.className = "image-comment-container";
    elmt.innerHTML = `<div class="image-container">
          <div class="image">
              <img src="/api/images/${image.id}/file" alt="${image.title}" class="gallery-image"/>
          </div>
          <div class="image-info">
              <div class="image-details image-title">Title: ${image.title}</div>
              <div class="image-details image-author">Author: ${image.User ? image.User.username : "Unknown"}</div>
          </div>
      </div>

      <div class="image-navigation">
          <div class="image-icons">
              <button class="icon previous" id="image-previous"></button>
              <button class="icon delete hidden" id="image-delete"></button>
              <button class="icon next" id="image-next"></button>
          </div>
      </div>

      `;

    // Get the current user
    const currentUser = getUsername();
    // Get the image user
    const imageUser = image.User.username;

    if (currentUser !== "" && currentUser === imageUser) {
      // Show delete button only if cur user is the image author
      elmt.querySelector("#image-delete").classList.remove("hidden");
    }

    // Event listener for Previous
    elmt
      .querySelector("#image-previous")
      .addEventListener("click", function () {
        const curIndex = getImageOffset();
        if (getImageLoading() || curIndex <= 0) return;
        setImageLoading(true);
        setImageOffset(curIndex - 1);
      });

    // Event Listener for Next
    elmt.querySelector("#image-next").addEventListener("click", function () {
      if (getImageLoading()) return;
      const max = getImageCount() - 1;
      const currentIndex = getImageOffset();
      if (currentIndex >= max) return;
      setImageLoading(true);
      setImageOffset(currentIndex + 1);
    });
    // Event Listener for Delete Image
    elmt.querySelector("#image-delete").addEventListener("click", function () {
      if (getImageLoading()) return;
      setImageLoading(true);
      setCommentsLoading(true);
      setImageError("");
      apiService
        .deleteImage(image.id)
        .then(() => {
          setImageError("");
          setImageCount(getImageCount() - 1);
          const count = getImageCount();
          if (count === 0) {
            setImage(null);
            setComments([]);
            const rightPanel = document.querySelector(".right-panel");
            rightPanel.classList.add("hidden");
            const imageContainer = document.querySelector(".gallery-container");
            imageContainer.innerHTML = "";
          } else {
            const newIndex = Math.min(getImageOffset(), count - 1);
            setImageOffset(newIndex);
          }
        })
        .catch(() => {
          setImageError("Failed to delete image. Please try again.");
          setImageLoading(false);
          setCommentsLoading(false);
        });
    });
    return elmt;
  }

  function CommentComponent(comment, imageId) {
    // Get the current user
    const currentUser = getUsername();
    // Get the comment user
    const commentUser = comment.User.username;

    const elmt = document.createElement("div");
    elmt.className = "row comment";

    elmt.innerHTML = `
          <div class="col-10 comment-info">
              <div class="comment-header">
                  <div class="comment-author">${commentUser ? commentUser : "Unknown"}</div>
                  <div class="comment-date">(${new Date(
                    comment.createdAt,
                  ).toLocaleString()})</div>
              </div>
              <div class="comment-content">${comment.content}</div>
          </div>
          <div class="col-2">
              <button class="icon delete hidden" id="comment-delete"></button>
          </div>
      `;

    if (currentUser !== "" && currentUser === commentUser) {
      // Show delete button only if cur user is the comment author
      elmt.querySelector("#comment-delete").classList.remove("hidden");
    }

    // Event Listener for Deleting a comment
    elmt.querySelector("#comment-delete").addEventListener("click", () => {
      setCommentsLoading(true);
      setCommentError("");
      apiService
        .deleteComment(imageId, String(comment.id))
        .then(() => {
          setCommentError("");
          apiService
            .getComments(imageId)
            .then((comments) => {
              setCommentPage(0);
              setComments(comments);
            })
            .catch(() => {
              setCommentError("Failed to get comments. Please try again.");
              setCommentsLoading(false);
            })
            .finally(() => {
              setCommentsLoading(false);
            });
        })
        .catch(() => {
          setCommentError("Failed to delete comment. Please try again.");
          setCommentsLoading(false);
        });
    });

    return elmt;
  }

  // Function to display the comments for an image
  function renderComments() {
    // Hide comment section if not authed
    const commentSection = document.querySelector(".comment-section-container");
    if (!getIsAuthed()) {
      if (commentSection) commentSection.classList.add("hidden");
      return;
    } else {
      if (commentSection) commentSection.classList.remove("hidden");
    }
    document.querySelector(".right-panel").classList.remove("hidden");
    const commentContainer = document.querySelector(".comments");
    if (commentContainer) commentContainer.innerHTML = "";

    const commentList = getComments();

    // Update the comment count
    const totalComments = document.querySelector(
      ".right-panel .total-comments",
    );
    if (totalComments) {
      totalComments.textContent = `Total Comments: ${getCommentCount()}`;
    }

    if (commentList.length === 0) {
      if (commentContainer) commentContainer.textContent = "No comments yet.";
      return;
    }

    commentList.forEach((comment) => {
      commentContainer.append(CommentComponent(comment, String(getImage().id)));
    });
  }

  // Function to Display the image by creating an Image Component
  function renderImage(image) {
    const container = document.querySelector(".gallery-container");
    container.innerHTML = "";
    if (!getImageLoading() && image) container.append(ImageComponent(image));
  }

  // Function to Update the Gallery Image Count at Top of Screen
  function updateImageCount(count) {
    const galleryImagesElement = document.querySelector(".gallery-images");

    // Hide the element if count is null or undefined (still loading)
    if (count === null || count === undefined) {
      if (galleryImagesElement) galleryImagesElement.classList.add("hidden");
      return;
    }

    if (count === 0) {
      setImageLoading(false);
      setCommentsLoading(false);
      // Only show "No images yet" if there's a current user gallery but no images
      if (getCurUserGallery()) {
        galleryImagesElement.textContent = "No images yet.";
      } else {
        galleryImagesElement.textContent = "";
      }
      if (galleryImagesElement) galleryImagesElement.classList.remove("hidden");
      document.querySelector(".right-panel").classList.add("hidden");
      return;
    }

    galleryImagesElement.textContent = `Gallery Image: ${getImageOffset() + 1}/${count}`;
    if (galleryImagesElement) galleryImagesElement.classList.remove("hidden");
  }

  // Runs when page opens
  window.addEventListener("DOMContentLoaded", function () {
    setImageError("");

    // On load, check if user is authenticated
    apiService.getCurrentUser().then((user) => {
      if (user) {
        setIsAuthed(true);
        setUsername(user.username);
      } else {
        setIsAuthed(false);
        setUsername("");
      }
    });
    // Get Initial User Count
    setUserGalleryLoading(true);
    apiService
      .getUserCount()
      .then((count) => {
        setUserCount(count);
        setUserGalleryError("");
        setUserGalleryLoading(false);
      })
      .catch(() => {
        setUserGalleryError("Failed to get user count. Please try again.");
        setUserGalleryLoading(false);
      });

    // Get Initial Image Count for Current User Gallery
    if (getCurUserGallery()) {
      apiService
        .getImageCount(getCurUserGallery().id)
        .then((count) => {
          setImageCount(count);
          setImageError("");
        })
        .catch(() => {
          setImageError("Failed to get image count. Please try again.");
          setImageLoading(false);
        });
    }

    meact.useEffect(() => {
      updateAuthUI(getIsAuthed());
    }, [isAuthed]);

    meact.useEffect(() => {
      renderUserTitle(getUsername());
    }, [username]);

    meact.useEffect(() => {
      // Hide gallery navigation while user gallery is loading
      const galleryNav = document.querySelector(".gallery-navigation");
      if (getUserGalleryLoading()) {
        if (galleryNav) galleryNav.classList.add("hidden");
        return;
      }
      if (getCurUserGallery() === null && getUserCount() === 0) {
        if (galleryNav) galleryNav.classList.remove("hidden");
        const galleryUsernameDiv = document.querySelector(".gallery-username");
        if (galleryUsernameDiv) {
          galleryUsernameDiv.textContent = "No users found.";
        }
        document.querySelector("#user-previous").classList.add("hidden");
        document.querySelector("#user-next").classList.add("hidden");
      } else {
        if (galleryNav) galleryNav.classList.remove("hidden");
        const galleryUsernameDiv = document.querySelector(".gallery-username");
        if (galleryUsernameDiv) {
          galleryUsernameDiv.textContent = `@${getCurUserGallery()?.username}'s Gallery`;
        }
        document.querySelector("#user-previous").classList.remove("hidden");
        document.querySelector("#user-next").classList.remove("hidden");
      }
    }, [curUserGallery, userGalleryLoading]);

    // When user offset changes
    // Set offset for user gallery
    meact.useEffect(() => {
      setUserGalleryLoading(true);
      apiService.getPaginatedUsers(getUserOffset()).then((users) => {
        // If there are no users, set the gallery to null
        if (users.length === 0) {
          setCurUserGallery(null);
          setImageCount(0);
          setUserGalleryError("No users found.");
          setUserGalleryLoading(false);
          return;
        }
        setCurUserGallery(users[0]);
        setUserGalleryError("");
        setUserGalleryLoading(false);
        // Get the image count for the current user
        apiService.getImageCount(getCurUserGallery().id).then((count) => {
          setImageCount(count);
          setImageOffset(0);
          setImageError("");
        });
      });
    }, [userOffset]);

    // When image index changes - update image and reset comment page
    meact.useEffect(() => {
      if (!getCurUserGallery() || getImageCount() === 0) {
        setImage(null);
        setComments([]);
        updateImageCount(0);
        return;
      }
      setImageLoading(true);
      setCommentsLoading(true);
      setImageError("");
      // Clear image container
      const imageContainer = document.querySelector(".gallery-container");
      imageContainer.innerHTML = "";

      // Clear comments container
      const commentsContainer = document.querySelector(
        ".comment-section-container",
      );
      if (commentsContainer) commentsContainer.classList.add("hidden");

      apiService
        .getPaginatedUserGalleryImage(getCurUserGallery().id, getImageOffset())
        .then((images) => {
          setImageError("");
          if (images && images.length > 0) {
            setImage(images[0]);
            setCommentPage(0);
          } else {
            setImage(null);
            setComments([]);
          }
        })
        .catch(() => {
          setImageError("Failed to get image. Please try again.");
          setImage(null);
          setComments([]);
          updateImageCount(0);
        })
        .finally(() => {
          setImageLoading(false);
          setCommentsLoading(false);
          updateImageCount(getImageCount());
        });
    }, [imageOffset]);

    meact.useEffect(() => {
      updateImageCount(getImageCount());
      if (getImageCount() === 0) {
        setImage(null);
        setComments([]);
      }
    }, [imageCount]);

    meact.useEffect(() => {
      const image = getImage();
      renderImage(image);

      const addCommentForm = document.querySelector(".add-comment-form");
      if (addCommentForm) {
        if (getImage() && !getImageLoading()) {
          addCommentForm.classList.remove("hidden");
        } else {
          addCommentForm.classList.add("hidden");
        }
      }
    }, [image, imageLoading]);

    meact.useEffect(() => {
      // If not authenticated, do nothing here
      if (!getIsAuthed() || !getImage()) return;
      const image = getImage();
      setCommentsLoading(true);
      setCommentError("");
      Promise.all([
        apiService.getComments(String(image.id), getCommentPage()).catch(() => {
          setCommentError("Failed to load comments. Please try again.");
          setCommentsLoading(false);
          return [];
        }),
        apiService.getCommentCount(String(image.id)).catch(() => {
          setCommentError("Failed to load comment count. Please try again.");
          setCommentsLoading(false);
          return 0;
        }),
      ])
        .then(([comments, count]) => {
          setComments(comments);
          setCommentCount(count);
        })
        .finally(() => {
          setCommentsLoading(false);
        });
    }, [image, commentPage, isAuthed]);

    // When comments change - re-render
    meact.useEffect(() => {
      const image = getImage();
      // Only render comments if authed
      if (image && getIsAuthed()) renderComments();
      else {
        // Hide comment section if not authed
        const commentSection = document.querySelector(
          ".comment-section-container",
        );
        if (commentSection) commentSection.classList.add("hidden");
      }
    }, [comments, commentCount, isAuthed]);

    // When loading changes - update loading state
    meact.useEffect(() => {
      // If image loading is true, show the spinner and hide the image counter
      if (getImageLoading()) {
        // Hide image and comment forms in case they were already open
        document.querySelector(".add-image-form").classList.add("hidden");
        // Hide the image counter
        document.querySelector(".gallery-images").classList.add("hidden");
        // Hide toggle image form button
        document.querySelector("#toggle-image-form").classList.add("hidden");
        // Show the spinner
        document
          .querySelector("#image-container-spinner")
          .classList.remove("hidden");
      }
      // If image loading is false, hide the spinner
      else {
        document
          .querySelector("#image-container-spinner")
          .classList.add("hidden");
        // Show the image counter
        document.querySelector(".gallery-images").classList.remove("hidden");
        // Show toggle image form button if the user is authed
        if (
          getIsAuthed() &&
          getCurUserGallery() &&
          getUsername() === getCurUserGallery().username
        ) {
          document
            .querySelector("#toggle-image-form")
            .classList.remove("hidden");
        } else {
          document.querySelector("#toggle-image-form").classList.add("hidden");
        }
      }
    }, [imageLoading]);

    meact.useEffect(() => {
      // If comments loading is true, show the spinner and hide the comment counter
      const commentsSpinner = document.querySelector(
        "#comments-container-spinner",
      );
      const commentsContainer = document.querySelector(
        ".comment-section-container",
      );
      const totalComments = document.querySelector(
        ".right-panel .total-comments",
      );
      if (getCommentsLoading()) {
        // Show the spinner
        if (commentsSpinner) commentsSpinner.classList.remove("hidden");
        if (commentsContainer) commentsContainer.classList.add("hidden");
        if (totalComments) totalComments.classList.add("hidden");
      }
      // If comments loading is false, hide the spinner
      else {
        if (commentsSpinner) commentsSpinner.classList.add("hidden");
        if (commentsContainer) commentsContainer.classList.remove("hidden");
        if (totalComments) totalComments.classList.remove("hidden");
      }
    }, [commentsLoading]);

    // Event Listener for creating new image
    document
      .querySelector("#create-image-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        setImageError("");
        // rehide the form
        const title = document.querySelector("#image-title").value.trim();
        const file = document.querySelector("#image-file").files[0];

        e.target.reset();

        document.querySelector(".add-image-form").classList.add("hidden");

        apiService
          .addImage(title, file)
          .then(() => {
            setImageError("");
            apiService
              .getImageCount(getCurUserGallery().id)
              .then((count) => {
                setImageCount(count);
                setImageOffset(0);
                setImageError("");
              })
              .catch(() => {
                setImageError(
                  "Failed to update image count. Please try again.",
                );
                setImageLoading(false);
              });
          })
          .catch(() => {
            setImageError("Failed to add image. Please try again.");
            setImageLoading(false);
          });
      });

    document
      .querySelector("#toggle-image-form")
      .addEventListener("click", function () {
        document.querySelector(".add-image-form").classList.toggle("hidden");
      });

    document
      .querySelector(".add-comment-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        setCommentError("");
        const content = document.querySelector("#comment-content").value.trim();

        e.target.reset();

        setCommentsLoading(true);
        apiService
          .addComment(String(getImage().id), content)
          .then(() => {
            setCommentError("");
            return setCommentPage(0);
          })
          .catch(() => {
            setCommentError("Failed to add comment. Please try again.");
            setCommentsLoading(false);
          });
      });

    document
      .querySelector("#comment-next")
      .addEventListener("click", function () {
        setCommentError("");
        apiService
          .getComments(String(getImage().id), getCommentPage() + 1)
          .then((newComments) => {
            setCommentError("");
            if (newComments.length === 0) return;
            setCommentPage(getCommentPage() + 1);
          })
          .catch(() => {
            setCommentError("Failed to load more comments. Please try again.");
            setCommentsLoading(false);
          });
      });

    document
      .querySelector("#comment-previous")
      .addEventListener("click", function () {
        if (getCommentPage() > 0) {
          setCommentPage(getCommentPage() - 1);
        }
      });

    // Login
    document.querySelector("#login-button").addEventListener("click", (e) => {
      setAuthError("");
      e.preventDefault();
      const username = document.querySelector("#auth-username").value.trim();
      const password = document.querySelector("#auth-password").value.trim();

      if (!username || !password) {
        setAuthError("Username and password are required.");
        return;
      }
      apiService
        .loginUser(username, password)
        .then((user) => {
          // Clear the form fields
          document.querySelector("#auth-username").value = "";
          document.querySelector("#auth-password").value = "";
          setAuthError("");
          setIsAuthed(true);
          setUsername(user.username);
        })
        .catch(() => {
          setAuthError("Login failed. Please try again.");
        });
    });

    // Signup
    document.querySelector("#signup-button").addEventListener("click", (e) => {
      setAuthError("");
      e.preventDefault();
      const username = document.querySelector("#auth-username").value.trim();
      const password = document.querySelector("#auth-password").value.trim();

      if (!username || !password) {
        setAuthError("Username and password are required.");
        return;
      }
      apiService
        .registerUser(username, password)
        .then((user) => {
          // Clear the form fields
          document.querySelector("#auth-username").value = "";
          document.querySelector("#auth-password").value = "";
          setAuthError("");
          setIsAuthed(true);
          setUsername(user.username);
          // Increment user count
          setUserCount(getUserCount() + 1);
          setUserOffset(0);
        })
        .catch(() => {
          setAuthError("Signup failed. Please try again.");
        });
    });

    // Logout
    document.querySelector("#logout-button").addEventListener("click", (e) => {
      e.preventDefault();
      setAuthError("");
      apiService
        .logoutUser()
        .then(() => {
          setAuthError("");
          setIsAuthed(false);
          setUsername("");
          setUserOffset(0);
          setImageOffset(0);
        })
        .catch(() => {
          setAuthError("Logout failed. Please try again.");
        });
    });

    // Gallery Navigation Buttons
    document
      .querySelector("#user-previous")
      .addEventListener("click", function () {
        if (getUserOffset() > 0) {
          setUserOffset(getUserOffset() - 1);
        }
      });
    document.querySelector("#user-next").addEventListener("click", function () {
      if (getUserOffset() < getUserCount() - 1) {
        setUserOffset(getUserOffset() + 1);
      }
    });
  });
})();

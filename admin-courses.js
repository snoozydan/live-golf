AdminCommon.initAdminPage({
  renderContent({ state, tournament, selectedTournamentId, rerender, setMessage, replaceState, setDirty }) {
    const courseEditTargetSelect = document.getElementById("course-edit-target-select");
    const courseList = document.getElementById("admin-course-list");
    const courseSectionLabel = document.getElementById("course-section-label");
    const applyCourseTemplateSelect = document.getElementById("apply-course-template-select");
    const applyCourseTemplateButton = document.getElementById("apply-course-template-button");
    const saveCourseTemplateNameInput = document.getElementById("save-course-template-name-input");
    const saveCourseTemplateButton = document.getElementById("save-course-template-button");
    const saveButton = document.getElementById("save-button");

    let selectedCourseEditTarget = "tournament";
    let draftCourse = tournament ? tournament.course.map((hole) => ({ ...hole })) : [];

    function currentTemplate() {
      return TournamentStore.listCourseTemplates(state).find((template) => template.id === selectedCourseEditTarget) || null;
    }

    function getActiveCourse() {
      return selectedCourseEditTarget === "tournament" ? draftCourse : currentTemplate()?.course || [];
    }

    function renderCourseControls() {
      const courseTemplates = TournamentStore.listCourseTemplates(state);
      const courseOptions = courseTemplates.map((template) => `<option value="${template.id}">${template.name}</option>`).join("");
      courseEditTargetSelect.innerHTML = `<option value="tournament">Selected tournament course · ${tournament?.courseName || ""}</option>${courseOptions}`;
      courseEditTargetSelect.value = selectedCourseEditTarget;
      applyCourseTemplateSelect.innerHTML = `<option value="">Choose a saved course</option>${courseOptions}`;
      courseSectionLabel.textContent =
        selectedCourseEditTarget === "tournament"
          ? `Course holes for ${tournament?.courseName || "selected tournament"}`
          : `Course holes for ${currentTemplate()?.name || "saved template"}`;
    }

    function renderCourseList() {
      const activeCourse = getActiveCourse();
      courseList.innerHTML = activeCourse
        .map(
          (hole) => `
            <article class="admin-row">
              <div class="admin-row-header">
                <div>
                  <div class="player-name">Hole ${hole.hole}</div>
                  <div class="admin-meta">Set par, yardage, and handicap stroke index</div>
                </div>
              </div>
              <form class="admin-controls" data-hole-form="${hole.hole}">
                <label>
                  Par
                  <input type="number" min="3" max="6" name="par" value="${hole.par}" />
                </label>
                <label>
                  Stroke index
                  <input type="number" min="1" max="18" name="strokeIndex" value="${hole.strokeIndex}" />
                </label>
                <label>
                  Yardage
                  <input type="number" min="1" max="800" name="yardage" value="${hole.yardage}" />
                </label>
              </form>
            </article>
          `,
        )
        .join("");

      document.querySelectorAll("[data-hole-form]").forEach((form) => {
        form.addEventListener("input", () => {
          const holeNumber = Number(form.getAttribute("data-hole-form"));
          const hole = getActiveCourse()[holeNumber - 1];
          if (!hole) return;
          hole.par = form.querySelector('input[name="par"]').value;
          hole.strokeIndex = form.querySelector('input[name="strokeIndex"]').value;
          hole.yardage = form.querySelector('input[name="yardage"]').value;
          setDirty(true);
          setMessage("Unsaved course changes.");
        });
      });
    }

    courseEditTargetSelect.addEventListener("change", () => {
      if (selectedCourseEditTarget !== courseEditTargetSelect.value) {
        setDirty(false);
      }
      selectedCourseEditTarget = courseEditTargetSelect.value;
      renderCourseControls();
      renderCourseList();
    });

    applyCourseTemplateButton.onclick = async () => {
      if (!applyCourseTemplateSelect.value) {
        setMessage("Choose a saved course first.");
        return;
      }
      try {
        let nextState = TournamentStore.applyCourseTemplate(TournamentStore.loadState(), selectedTournamentId, applyCourseTemplateSelect.value);
        if (window.AppData?.enabled()) {
          nextState = await window.AppData.persistState(nextState);
        }
        replaceState(nextState);
        draftCourse = TournamentStore.getTournament(nextState, selectedTournamentId)?.course.map((hole) => ({ ...hole })) || [];
        setDirty(false);
        setMessage("Applied course template to selected tournament.");
        await rerender(true);
      } catch (error) {
        console.error("Apply course template failed", error);
        setMessage("Could not apply the saved course. Please try again.");
      }
    };

    saveCourseTemplateButton.onclick = async () => {
      try {
        let nextState = TournamentStore.saveTournamentCourseAsTemplate(
          TournamentStore.loadState(),
          selectedTournamentId,
          saveCourseTemplateNameInput.value.trim(),
        );
        if (window.AppData?.enabled()) {
          nextState = await window.AppData.persistState(nextState);
        }
        replaceState(nextState);
        saveCourseTemplateNameInput.value = "";
        setDirty(false);
        setMessage("Saved current tournament course as template.");
        await rerender(true);
      } catch (error) {
        console.error("Save course template failed", error);
        setMessage("Could not save the course template. Please try again.");
      }
    };

    saveButton.onclick = async () => {
      try {
        let nextState = TournamentStore.loadState();
        if (selectedCourseEditTarget === "tournament") {
          draftCourse.forEach((hole) => {
            nextState = TournamentStore.updateHole(nextState, selectedTournamentId, hole.hole, hole);
          });
        } else {
          getActiveCourse().forEach((hole) => {
            nextState = TournamentStore.updateCourseTemplate(nextState, selectedCourseEditTarget, {
              holeNumber: hole.hole,
              ...hole,
            });
          });
        }
        if (window.AppData?.enabled()) {
          nextState = await window.AppData.persistState(nextState);
        }
        replaceState(nextState);
        setDirty(false);
        setMessage("Saved course changes.");
        await rerender(true);
      } catch (error) {
        console.error("Save course changes failed", error);
        setMessage("Could not save course changes. Please try again.");
      }
    };

    renderCourseControls();
    renderCourseList();
  },
});

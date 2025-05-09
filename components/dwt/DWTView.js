import React, { useState, useEffect, useRef } from "react";
import "./DWTView.css";
import {
  Edit,
  RotateCcw,
  RotateCw,
  Repeat,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Trash,
  Maximize,
  Crop as CropIcon,
  Upload,
} from "lucide-react";

/**
 * DWTView component for displaying and manipulating images with Dynamic Web TWAIN
 *
 * @param {Object} props Component props
 * @param {WebTwain} props.dwt - The object to perform the magic of Dynamic Web TWAIN
 * @param {object} props.buffer - The buffer status of data in memory (current & count)
 * @param {object[]} props.zones - The zones on the current image that are selected by the user
 * @param {string} props.containerId - The id of a DIV in which the view of Dynamic Web TWAIN will be built
 * @param {object} props.runtimeInfo - Contains runtime information like the width & height of the current image
 * @param {boolean} props.bNoNavigating - Whether navigation buttons will function
 * @param {object[]} props.barcodeRects - The rects that indicate where barcodes are found
 * @param {function} props.handleBufferChange - A function to call when the buffer may requires updating
 * @param {function} props.handleOutPutMessage - A function to call a message needs to be printed out
 * @param {function} props.handleViewerSizeChange - A function to call when the viewer size changes
 */
const DWTView = ({
  dwt,
  buffer,
  zones,
  containerId,
  runtimeInfo,
  bNoNavigating,
  barcodeRects = [],
  blocks,
  handleBufferChange,
  handleOutPutMessage,
  handleViewerSizeChange,
}) => {
  // Config values based on blocks prop
  const getDimensions = () => {
    let width = "585px";
    let height = "513px";
    let navigatorRight = "60px";
    let navigatorWidth = "585px";

    if (blocks !== undefined) {
      switch (blocks) {
        case 0: // No navigate, no quick edit
          width = "100%";
          height = "100%";
          break;
        case 1: // No quick edit
          width = "100%";
          navigatorWidth = "100%";
          navigatorRight = "0px";
          break;
        case 2: // No navigate
          height = "100%";
          break;
        default:
          break;
      }
    }

    return { width, height, navigatorRight, navigatorWidth };
  };

  const { width, height, navigatorRight, navigatorWidth } = getDimensions();

  // Setup state
  const [viewReady, setViewReady] = useState(false);
  const [bShowChangeSizeUI, setShowChangeSizeUI] = useState(false);
  const [newHeight, setNewHeight] = useState(
    runtimeInfo ? runtimeInfo.ImageHeight : 0,
  );
  const [newWidth, setNewWidth] = useState(
    runtimeInfo ? runtimeInfo.ImageWidth : 0,
  );
  const [interpolationMethod, setInterpolationMethod] = useState("1"); // 1> NearestNeighbor, 2> Bilinear, 3> Bicubic
  const [previewMode, setPreviewMode] = useState("1");

  // Regular expression for validation
  const re = /^\d+$/;

  // References
  const DWTObjectRef = useRef(null);
  const imageEditorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize when dwt prop changes
  useEffect(() => {
    if (dwt) {
      DWTObjectRef.current = dwt;
      setViewReady(true);
    }
  }, [dwt]);

  // Set viewer dimensions when view becomes ready
  useEffect(() => {
    if (DWTObjectRef.current && viewReady) {
      DWTObjectRef.current.Viewer.width = width;
      DWTObjectRef.current.Viewer.height = height;
    }
  }, [viewReady, width, height]);

  // Handle barcode rects display mode change
  useEffect(() => {
    if (barcodeRects.length !== 0 && !bNoNavigating) {
      handlePreviewModeChange("1");
    }
  }, [barcodeRects, bNoNavigating]);

  // Update dimensions when image size changes
  useEffect(() => {
    if (runtimeInfo) {
      setNewHeight(runtimeInfo.ImageHeight);
      setNewWidth(runtimeInfo.ImageWidth);
    }
  }, [runtimeInfo]);

  // Handle viewer size change
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (container && container.offsetWidth !== 0 && handleViewerSizeChange) {
      handleViewerSizeChange({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    }
  }, [containerId, handleViewerSizeChange]);

  // Helper function to update buffer
  const updateBuffer = () => {
    if (handleBufferChange) {
      handleBufferChange({
        current: DWTObjectRef.current.CurrentImageIndexInBuffer,
        count: DWTObjectRef.current.HowManyImagesInBuffer,
      });
    }
  };

  // Quick Edit handler
  const handleQuickEdit = (event) => {
    // Handle keyboard events (only proceed for space key or non-keyboard events)
    if (event.keyCode && event.keyCode !== 32) return;

    // Check if buffer is empty
    if (!buffer || buffer.count === 0) {
      handleOutPutMessage("There is no image in Buffer!", "error");
      return;
    }

    // Get action value from button attribute
    const action = event.currentTarget.getAttribute("value");

    switch (action) {
      case "editor":
        imageEditorRef.current =
          DWTObjectRef.current.Viewer.createImageEditor();
        imageEditorRef.current.show();
        break;
      case "rotateL":
        DWTObjectRef.current.RotateLeft(buffer.current);
        updateBuffer();
        break;
      case "rotateR":
        DWTObjectRef.current.RotateRight(buffer.current);
        updateBuffer();
        break;
      case "rotate180":
        DWTObjectRef.current.Rotate(buffer.current, 180, true);
        updateBuffer();
        break;
      case "mirror":
        DWTObjectRef.current.Mirror(buffer.current);
        updateBuffer();
        break;
      case "flip":
        DWTObjectRef.current.Flip(buffer.current);
        updateBuffer();
        break;
      case "removeS":
        DWTObjectRef.current.RemoveAllSelectedImages();
        updateBuffer();
        break;
      case "removeA":
        DWTObjectRef.current.RemoveAllImages();
        updateBuffer();
        break;
      case "changeSize":
        setShowChangeSizeUI(!bShowChangeSizeUI);
        break;
      case "crop":
        crop();
        break;
      case "changeImageSizeOK":
        changeImageSizeOK();
        break;
      default:
        console.log("Unknown action:", action);
        break;
    }
  };

  // Handle new size input
  const handleNewSize = (event, bHeight) => {
    // Validate input is numeric
    if (!re.test(event.target.value)) {
      return;
    } else {
      if (bHeight) setNewHeight(event.target.value);
      else setNewWidth(event.target.value);
    }
  };

  // Handle interpolation method change
  const handleInterpolationMethodChange = (event) => {
    setInterpolationMethod(event.target.value);
  };

  // Change image size with selected parameters
  const changeImageSizeOK = () => {
    DWTObjectRef.current.ChangeImageSize(
      buffer.current,
      newWidth,
      newHeight,
      parseInt(interpolationMethod),
    );
    setShowChangeSizeUI(!bShowChangeSizeUI);
    updateBuffer();
  };

  // Crop image based on selected zone
  const crop = () => {
    // Validate zones for cropping
    if (!zones || zones.length === 0) {
      handleOutPutMessage(
        "Please select where you want to crop first!",
        "error",
      );
    } else if (zones.length > 1) {
      handleOutPutMessage("Please select only one rectangle to crop!", "error");
    } else {
      let _zone = zones[0];
      DWTObjectRef.current.Crop(
        buffer.current,
        _zone.x,
        _zone.y,
        _zone.x + _zone.width,
        _zone.y + _zone.height,
      );
      updateBuffer();
    }
  };

  // Handle navigation actions
  const handleNavigation = (action) => {
    if (!DWTObjectRef.current) return;

    switch (action) {
      default: //viewModeChange, removeAll
        break;
      case "first":
        DWTObjectRef.current.CurrentImageIndexInBuffer = 0;
        break;
      case "last":
        DWTObjectRef.current.CurrentImageIndexInBuffer = buffer.count - 1;
        break;
      case "previous":
        if (buffer.current > 0) {
          DWTObjectRef.current.CurrentImageIndexInBuffer = buffer.current - 1;
        }
        break;
      case "next":
        if (buffer.current < buffer.count - 1) {
          DWTObjectRef.current.CurrentImageIndexInBuffer = buffer.current + 1;
        }
        break;
    }

    updateBuffer();
  };

  // Handle preview mode change
  const handlePreviewModeChange = (event) => {
    let _newMode = "";
    if (event && event.target) {
      _newMode = event.target.value;
    } else {
      if (parseInt(event) > 0 && parseInt(event) < 6)
        _newMode = parseInt(event).toString();
    }

    if (_newMode !== previewMode) {
      // Check if navigation is allowed
      if (bNoNavigating) {
        handleOutPutMessage("Navigation not allowed!", "error");
        return;
      }

      // Check if barcode rects are displayed
      if (previewMode === "1" && barcodeRects.length > 0) {
        handleOutPutMessage(
          "Can't change view mode when barcode rects are on display!",
          "error",
        );
        return;
      }

      // Update preview mode
      setPreviewMode(_newMode);
      DWTObjectRef.current.Viewer.setViewMode(
        parseInt(_newMode),
        parseInt(_newMode),
      );
      DWTObjectRef.current.MouseShape = parseInt(_newMode) > 1;
      handleNavigation("viewModeChange");
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && DWTObjectRef.current) {
      DWTObjectRef.current.LoadImageEx(
        file.name,
        5, // EnumDWT_ImageType.IT_ALL = 5
        {
          onSuccess: () => {
            updateBuffer();
            handleOutPutMessage("Image loaded successfully", "info");
          },
          onFailure: (errCode, errString) => {
            handleOutPutMessage(`Load failed: ${errString}`, "error");
          },
        },
      );
    }
  };

  // Define icon style
  const iconStyle = {
    cursor: "pointer",
    padding: "5px",
  };

  return (
    <>
      {/* Loading state or initial container */}
      <div
        style={{ display: viewReady ? "none" : "block" }}
        className="DWTcontainerTop"
      ></div>

      {/* Main container */}
      <div
        style={{ display: viewReady ? "block" : "none" }}
        className="DWTcontainerTop"
      >
        {/* Load Image Button */}
        <button
          onClick={() => fileInputRef.current.click()}
          style={{ marginBottom: 10 }}
        >
          <Upload size={18} /> Load Image
        </button>
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Quick Edit toolbar */}
        <div
          style={
            blocks & 2 && viewReady ? { display: "block" } : { display: "none" }
          }
          className="divEdit"
        >
          <ul className="operateGrp">
            {[
              ["editor", Edit, "Show Image Editor"],
              ["rotateL", RotateCcw, "Rotate Left"],
              ["rotateR", RotateCw, "Rotate Right"],
              ["rotate180", Repeat, "Rotate 180"],
              ["mirror", FlipHorizontal, "Mirror"],
              ["flip", FlipVertical, "Flip"],
              ["removeS", Trash2, "Remove Selected Images"],
              ["removeA", Trash, "Remove All Images"],
              ["changeSize", Maximize, "Change Image Size"],
              ["crop", CropIcon, "Crop"],
            ].map(([val, Icon, title]) => (
              <li key={val}>
                <div
                  tabIndex="6"
                  value={val}
                  title={title}
                  onClick={handleQuickEdit}
                  onKeyUp={handleQuickEdit}
                  style={iconStyle}
                >
                  <Icon size={24} />
                </div>
              </li>
            ))}
          </ul>

          {/* Image size editor panel */}
          <div
            className="ImgSizeEditor"
            style={
              bShowChangeSizeUI
                ? { visibility: "visible" }
                : { visibility: "hidden" }
            }
          >
            <ul>
              {/* Height input */}
              <li>
                <label>
                  Height:
                  <input
                    tabIndex="6"
                    type="text"
                    value={newHeight}
                    onChange={(event) => handleNewSize(event, true)}
                  />
                </label>
              </li>

              {/* Width input */}
              <li>
                <label>
                  Width:
                  <input
                    tabIndex="6"
                    type="text"
                    value={newWidth}
                    onChange={(event) => handleNewSize(event, false)}
                  />
                </label>
              </li>

              {/* Interpolation method selector */}
              <li>
                Interpolation:
                <select
                  tabIndex="6"
                  value={interpolationMethod}
                  onChange={handleInterpolationMethodChange}
                >
                  <option value="1">NearestNeighbor</option>
                  <option value="2">Bilinear</option>
                  <option value="3">Bicubic</option>
                </select>
              </li>

              {/* Action buttons */}
              <li>
                <button
                  tabIndex="6"
                  value="changeImageSizeOK"
                  onClick={handleQuickEdit}
                >
                  OK
                </button>
                <button
                  tabIndex="6"
                  value="changeSize"
                  onClick={handleQuickEdit}
                >
                  Cancel
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Image container */}
        <div
          id={containerId}
          style={{
            width: "100%",
            height: "400px",
            border: "1px solid #ccc",
          }}
        >
          {/* Barcode rectangles overlay */}
          {barcodeRects.map((_rect, _index) => (
            <div
              key={_index}
              className="barcodeInfoRect"
              style={{
                left: _rect.x + "px",
                top: _rect.y + "px",
                width: _rect.w + "px",
                height: _rect.h + "px",
              }}
            >
              <div className="spanContainer">
                <span>[{_index + 1}]</span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation panel */}
        <div
          style={
            blocks & 1 && viewReady
              ? {
                  display: "block",
                  width: navigatorWidth,
                  left: navigatorRight,
                }
              : { display: "none" }
          }
          className="navigatePanel clearfix"
        >
          <button
            value="first"
            onClick={(e) => handleNavigation(e.target.value)}
          >
            |&lt;
          </button>
          <button
            value="previous"
            onClick={(e) => handleNavigation(e.target.value)}
          >
            &lt;
          </button>
          &nbsp;
          <input
            type="text"
            value={buffer?.current + 1 || 0}
            readOnly
            style={{ width: "30px" }}
          />{" "}
          /
          <input
            type="text"
            value={buffer?.count || 0}
            readOnly
            style={{ width: "30px" }}
          />
          &nbsp;
          <button
            value="next"
            onClick={(e) => handleNavigation(e.target.value)}
          >
            &gt;
          </button>
          <button
            value="last"
            onClick={(e) => handleNavigation(e.target.value)}
          >
            &gt;|
          </button>
          <select value={previewMode} onChange={handlePreviewModeChange}>
            {[1, 2, 3, 4, 5].map((mode) => (
              <option key={mode} value={mode}>
                {mode}x{mode}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default DWTView;

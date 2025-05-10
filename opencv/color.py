import numpy as np
import cv2

def apply_color_filter(image,filter_type):
    filtered_image = image.copy()

    if filter_type == 'red':
        filtered_image[:,:,0] = 0
        filtered_image[:,:,1] = 0
    elif filter_type == 'green':
        filtered_image[:,:,0] = 0
        filtered_image[:,:,2] = 0
    elif filter_type == 'blue':
        filtered_image[:,:,1] = 0
        filtered_image[:,:,2] = 0
    elif filter_type == 'increase_red':
        filtered_image[:,:,2]=cv2.add(filtered_image[:,:,2],50)
    elif filter_type == 'decrease_red':
        filtered_image[:,:,2]=cv2.subtract(filtered_image[:,:,2],50)
    return filtered_image


image_path='dilmedisco.jpg'
image = cv2.imread(image_path)
if image is None:
    print("error img not found")
else:
    filter_type = "original"
    print("Press the following keys to apply filter")
    print("r: Red Filter")
    print("g: green Filter")
    print("b: blue Filter")
    print("i:increase red")
    print("d:decrease red")
    print("q:quit")
    while True:
        filtered_image = apply_color_filter(image, filter_type)
        cv2.imshow('filtered image',filtered_image)
        key = cv2.waitKey(0) & 0xFF
        if key == ord('r'):
            filter_type = 'red'
        elif key == ord('g'):
            filter_type = 'green'
        elif key == ord('b'):
            filter_type = 'blue'
        elif key == ord('i'):
            filter_type = 'increase_red'
        elif key == ord('d'):
            filter_type = 'decrease_red'
        elif key == ord('q'):
            break
    cv2.destroyAllWindows()
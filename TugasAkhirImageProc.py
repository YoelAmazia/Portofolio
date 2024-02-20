import cv2 as cv
import imutils as im

image = cv.imread('TugasAkhirImageproc/images/image2.jpg')
image = im.resize(image, width=500)

gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)

blur = cv.bilateralFilter(gray, 11, 17, 17)

edgeDet = cv.Canny(blur, 170, 200)

(cnts, _) = cv.findContours(edgeDet.copy(), cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
cnts = sorted(cnts, key = cv.contourArea, reverse = True)[:30]

NumberPlateCnt = None

count = 0
for c in cnts:
        peri = cv.arcLength(c, True)
        approx = cv.approxPolyDP(c, 0.4 * peri, True)
        if len(approx) == 4:
            NumberPlateCnt = approx
            break

cv.drawContours(image, [NumberPlateCnt], -1, (0,255,0), 3)
cv.imwrite('hasildeteksi4.jpg', image)
cv.imshow("Plat Nomer Yang Terdeteksi", image)

cv.waitKey(0)
cv.destroyAllWindows()
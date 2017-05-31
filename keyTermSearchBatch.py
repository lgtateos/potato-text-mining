import re, os, sys

# Place this script in directory with txt files
# It will create an output directory named "out" and write a file named "results.txt"
#      with all the findings from the text file.
mypath = os.path.dirname(sys.argv[0]) + "/"
allFiles = os.listdir(mypath)
textFiles = [f for f in allFiles if f.endswith(".txt")]

outputDir = mypath + "out/"

#If an output directory doesn't exist yet, make one.
if not os.path.exists(outputDir):
    os.mkdir(outputDir)
outF = open(outputDir + "results.txt", 'w')


#'C:/Users/lgtateos/Documents/ccurrentProjects/NLP/clavinPDF/pReports/US Patent Reports From LP/1841.txt'
for myfile in textFiles:
    inf = open(mypath + myfile, 'r')

    contents = inf.read()
    inf.close()

    #Change as needed
    termsOFinterest = ["potato", "rot", "rotted", "weather", "disease", "rain",
               "rains", "decay", "sudden decay", "fungus", "black spot", "mould"]
    #Terms to remove
    termsToAvoid = ["dry rot", "sweet potato", "sweet potatoes"]
    
    
    numberOfChar = 50
    message = "******************FILE NAME: "+ myfile+ " ******************\n"
    outF.write(message)
    print message
    for term in termsOFinterest:
        theCount = contents.count(term)
        #print term, "appears this many times: ", theCount
        message =  "Mention of " + term + "\n-----------------------------------"
        outF.write(message)
        print message
        trueCount = theCount
        if theCount > 0:
            for m in re.finditer(term, contents):
                reallyMyWord = True
                # Remove plurals of another term in list
                # (e.g., don't add potatoes to the potato list)
                for i in termsOFinterest:
                    # Compare the terms interest with the start of the string.Formatter
                    # If it starts with one of the terms and is not a substring of the term, then it's a plural.
                    # Remove it from the count and don't write it to the file.
                    if contents[m.start() : ].startswith(i) and i not in term:
                        #print "This is another search term:", i
                        reallyMyWord = False
                        trueCount = trueCount - 1
                # If it hasn't yet been elimiated, check if it's one of our terms to avoid.
                # (E.g., we want potatoe, but not sweet potato)
                if reallyMyWord:
                    for bTerm in termsToAvoid:
                        if term in bTerm:
                            start = m.end()-len(bTerm)
                            if contents[start:m.end()] == bTerm:
                                reallyMyWord = False
                                trueCount = trueCount - 1                                
                if reallyMyWord: 
                #print(m.start(), m.end())
                    message =  "\n\t"+ contents[m.start() - numberOfChar : m.start() + numberOfChar +len(term)]
                    outF.write(message)
                    print message
            message = "\nThe count for {0} is: {1}\n".format(term, trueCount)
            outF.write(message)
            print message
            
outF.close()